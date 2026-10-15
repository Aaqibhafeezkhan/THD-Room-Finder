package de.thd.roomfinder.update;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

public class AppUpdatePluginTest {
    @Rule
    public TemporaryFolder tmp = new TemporaryFolder();

    private File zip(String... entries) throws IOException {
        File f = tmp.newFile();
        try (ZipOutputStream out = new ZipOutputStream(new FileOutputStream(f))) {
            for (String name : entries) {
                out.putNextEntry(new ZipEntry(name));
                if (!name.endsWith("/")) out.write(name.getBytes(StandardCharsets.UTF_8));
                out.closeEntry();
            }
        }
        return f;
    }

    @Test
    public void sha256MatchesTheReleaseManifestFormat() throws Exception {
        File f = tmp.newFile();
        Files.write(f.toPath(), "x".getBytes(StandardCharsets.UTF_8));
        // Same value as node's createHash('sha256').update('x').digest('hex').
        assertEquals("2d711642b726b04401627ca9fbac32f5c8530fb1903cc4db02258717921a4881", AppUpdatePlugin.sha256(f));
    }

    @Test
    public void unpacksABundleWithFolders() throws Exception {
        File dir = new File(tmp.getRoot(), "bundle");
        AppUpdatePlugin.unzip(zip("assets/", "assets/index.js", "index.html"), dir);
        assertTrue(new File(dir, "index.html").isFile());
        assertEquals("assets/index.js", new String(Files.readAllBytes(new File(dir, "assets/index.js").toPath()), StandardCharsets.UTF_8));
    }

    @Test
    public void refusesEntriesOutsideTheBundle() throws Exception {
        File dir = new File(tmp.getRoot(), "bundle");
        try {
            AppUpdatePlugin.unzip(zip("index.html", "../evil.txt"), dir);
            fail("expected the entry to be refused");
        } catch (IOException | SecurityException expected) {
            // Refused by the check or by the platform's own zip-slip guard.
        }
        assertFalse(new File(tmp.getRoot(), "evil.txt").exists());
    }

    @Test
    public void deletesAWholeTree() throws Exception {
        File dir = new File(tmp.getRoot(), "bundle");
        AppUpdatePlugin.unzip(zip("a/b/c.txt", "index.html"), dir);
        AppUpdatePlugin.deleteTree(dir);
        assertFalse(dir.exists());
    }
}
