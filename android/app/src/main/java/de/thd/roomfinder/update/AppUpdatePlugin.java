package de.thd.roomfinder.update;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Handler;
import android.os.Looper;

import androidx.core.content.pm.PackageInfoCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.plugin.WebView;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.MessageDigest;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

/**
 * Live web updates for the Android app (#113, src/data/appUpdater.ts).
 *
 *   downloadBundle  downloads a release's web bundle, checks its SHA-256,
 *                   unpacks it and makes Capacitor serve it from the next
 *                   cold start (Capacitor's own serverBasePath setting)
 *   ready           called by every bundle once it has started; confirms a
 *                   new bundle as good
 *   status          failed and pending bundle versions
 *
 * A new bundle that doesn't call ready within 15 s, or whose launch never got
 * that far, is rolled back to the last good one and never tried again. A new
 * APK drops all downloaded bundles; Capacitor then serves the one inside it.
 */
@CapacitorPlugin(name = "AppUpdate")
public class AppUpdatePlugin extends Plugin {
    static final String RELEASES = "https://github.com/arudaev/THD-Room-Finder/releases/download/";
    private static final String PREFS = "AppUpdate";
    private static final long MAX_BUNDLE_BYTES = 50L << 20;
    private static final long READY_TIMEOUT_MS = 15_000;

    private final ExecutorService io = Executors.newSingleThreadExecutor();
    private final Handler main = new Handler(Looper.getMainLooper());
    private Runnable revert;

    @Override
    public void load() {
        // Runs before the bridge reads serverBasePath, so a rollback here
        // decides what this launch loads.
        SharedPreferences p = prefs();
        long binary = versionCode();
        if (p.getLong("binary", -1) != binary) {
            deleteTree(bundlesDir());
            p.edit().clear().putLong("binary", binary).commit();
            capacitorPrefs().edit().putString(WebView.CAP_SERVER_PATH, "").commit();
            return;
        }
        String trial = p.getString("trial", null);
        if (trial == null || !trial.equals(servedPath())) return;
        if (p.getBoolean("trialLaunched", false)) {
            rollBack(false);
            return;
        }
        p.edit().putBoolean("trialLaunched", true).commit();
        revert = () -> rollBack(true);
        main.postDelayed(revert, READY_TIMEOUT_MS);
    }

    @PluginMethod
    public void ready(PluginCall call) {
        if (revert != null) {
            main.removeCallbacks(revert);
            revert = null;
        }
        SharedPreferences p = prefs();
        String trial = p.getString("trial", null);
        if (trial != null && trial.equals(servedPath()) && p.getBoolean("trialLaunched", false)) {
            p.edit().putString("good", trial).remove("trial").remove("trialLaunched").commit();
        }
        String good = p.getString("good", "");
        String pending = p.getString("trial", "");
        io.execute(() -> {
            File[] dirs = bundlesDir().listFiles();
            if (dirs == null) return;
            for (File dir : dirs) {
                String path = dir.getAbsolutePath();
                if (!path.equals(good) && !path.equals(pending)) deleteTree(dir);
            }
        });
        call.resolve(status());
    }

    @PluginMethod
    public void status(PluginCall call) {
        call.resolve(status());
    }

    @PluginMethod
    public void downloadBundle(PluginCall call) {
        String url = call.getString("url");
        String sha256 = call.getString("sha256");
        String version = call.getString("version");
        if (url == null || !url.startsWith(RELEASES) || url.contains("..")
                || sha256 == null || !sha256.matches("[0-9a-f]{64}")
                || version == null || !version.matches("\\d+\\.\\d+\\.\\d+")) {
            call.reject("invalid bundle");
            return;
        }
        io.execute(() -> {
            File zip = new File(getContext().getCacheDir(), "bundle-" + version + ".zip");
            try {
                download(url, zip, MAX_BUNDLE_BYTES);
                if (!sha256.equals(sha256(zip))) throw new IOException("checksum mismatch");
                File staging = new File(bundlesDir(), version + ".partial");
                deleteTree(staging);
                unzip(zip, staging);
                if (!new File(staging, "index.html").isFile()) throw new IOException("no index.html");
                File target = new File(bundlesDir(), version);
                deleteTree(target);
                if (!staging.renameTo(target)) throw new IOException("cannot move bundle");
                prefs().edit().putString("trial", target.getAbsolutePath()).putBoolean("trialLaunched", false).commit();
                capacitorPrefs().edit().putString(WebView.CAP_SERVER_PATH, target.getAbsolutePath()).commit();
                call.resolve(status());
            } catch (Exception e) {
                call.reject(e.getMessage());
            } finally {
                zip.delete();
            }
        });
    }

    private void rollBack(boolean reload) {
        revert = null;
        SharedPreferences p = prefs();
        String trial = p.getString("trial", null);
        String good = p.getString("good", "");
        Set<String> failed = new HashSet<>(p.getStringSet("failed", new HashSet<>()));
        if (trial != null) failed.add(new File(trial).getName());
        p.edit().remove("trial").remove("trialLaunched").putStringSet("failed", failed).commit();
        boolean hasGood = !good.isEmpty() && new File(good).isDirectory();
        capacitorPrefs().edit().putString(WebView.CAP_SERVER_PATH, hasGood ? good : "").commit();
        if (reload) {
            if (hasGood) getBridge().setServerBasePath(good);
            else getBridge().setServerAssetPath("public");
        }
        if (trial != null) {
            File dir = new File(trial);
            io.execute(() -> deleteTree(dir));
        }
    }

    private JSObject status() {
        SharedPreferences p = prefs();
        JSArray failed = new JSArray();
        for (String v : p.getStringSet("failed", new HashSet<>())) failed.put(v);
        String trial = p.getString("trial", null);
        JSObject out = new JSObject();
        out.put("failed", failed);
        out.put("pending", trial != null && !p.getBoolean("trialLaunched", false) ? new File(trial).getName() : null);
        return out;
    }

    private SharedPreferences prefs() {
        return getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    private SharedPreferences capacitorPrefs() {
        return getContext().getSharedPreferences(WebView.WEBVIEW_PREFS_NAME, Context.MODE_PRIVATE);
    }

    private String servedPath() {
        return capacitorPrefs().getString(WebView.CAP_SERVER_PATH, "");
    }

    private File bundlesDir() {
        return new File(getContext().getFilesDir(), "bundles");
    }

    private long versionCode() {
        try {
            Context c = getContext();
            return PackageInfoCompat.getLongVersionCode(c.getPackageManager().getPackageInfo(c.getPackageName(), 0));
        } catch (Exception e) {
            return 0;
        }
    }

    /** Downloads a release asset (GitHub redirects to its CDN over HTTPS). */
    static void download(String url, File to, long maxBytes) throws IOException {
        HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
        c.setConnectTimeout(20_000);
        c.setReadTimeout(60_000);
        c.setInstanceFollowRedirects(true);
        try {
            int code = c.getResponseCode();
            if (code != 200) throw new IOException("HTTP " + code);
            try (InputStream in = new BufferedInputStream(c.getInputStream());
                    OutputStream out = new FileOutputStream(to)) {
                byte[] buf = new byte[64 * 1024];
                long total = 0;
                int n;
                while ((n = in.read(buf)) != -1) {
                    total += n;
                    if (total > maxBytes) throw new IOException("too large");
                    out.write(buf, 0, n);
                }
            }
        } finally {
            c.disconnect();
        }
    }

    static String sha256(File file) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        try (InputStream in = new BufferedInputStream(new FileInputStream(file))) {
            byte[] buf = new byte[64 * 1024];
            int n;
            while ((n = in.read(buf)) != -1) digest.update(buf, 0, n);
        }
        StringBuilder hex = new StringBuilder();
        for (byte b : digest.digest()) hex.append(String.format("%02x", b));
        return hex.toString();
    }

    static void unzip(File zip, File dir) throws IOException {
        if (!dir.mkdirs() && !dir.isDirectory()) throw new IOException("cannot create " + dir);
        String root = dir.getCanonicalPath() + File.separator;
        try (ZipInputStream in = new ZipInputStream(new BufferedInputStream(new FileInputStream(zip)))) {
            byte[] buf = new byte[64 * 1024];
            ZipEntry entry;
            while ((entry = in.getNextEntry()) != null) {
                File f = new File(dir, entry.getName());
                if (!f.getCanonicalPath().startsWith(root)) throw new IOException("bad entry " + entry.getName());
                if (entry.isDirectory()) {
                    f.mkdirs();
                    continue;
                }
                File parent = f.getParentFile();
                if (parent != null) parent.mkdirs();
                try (OutputStream out = new FileOutputStream(f)) {
                    int n;
                    while ((n = in.read(buf)) != -1) out.write(buf, 0, n);
                }
            }
        }
    }

    static void deleteTree(File f) {
        File[] children = f.listFiles();
        if (children != null) for (File c : children) deleteTree(c);
        f.delete();
    }
}
