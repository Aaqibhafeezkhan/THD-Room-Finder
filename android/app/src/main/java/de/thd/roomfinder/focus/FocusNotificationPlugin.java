package de.thd.roomfinder.focus;

import android.Manifest;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.util.ArrayList;
import java.util.List;

/**
 * Bridge for the focus-session notification (src/data/focusNotifier.ts).
 *
 *   schedule / clear       the stages to show (see FocusNotifier)
 *   action event           "confirm" or "end" from a notification action
 *   takeAway               time spent in other apps with the screen on: from
 *                          leaving the app while the screen is on until the
 *                          screen turns off or the app comes back
 *   exactAlarms /
 *   openExactAlarmSettings Android 12+ permission for alarms on the minute
 */
@CapacitorPlugin(
        name = "FocusNotification",
        permissions = {@Permission(alias = "notifications", strings = {Manifest.permission.POST_NOTIFICATIONS})})
public class FocusNotificationPlugin extends Plugin {
    private final List<long[]> away = new ArrayList<>();
    private long awaySince = 0;
    private BroadcastReceiver screenOff;

    @Override
    public void load() {
        FocusNotifier.ensureChannels(getContext());
        screenOff = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                closeAway(System.currentTimeMillis());
            }
        };
        ContextCompat.registerReceiver(
                getContext(), screenOff, new IntentFilter(Intent.ACTION_SCREEN_OFF), ContextCompat.RECEIVER_NOT_EXPORTED);
        if (getActivity() != null) deliver(getActivity().getIntent());
    }

    @Override
    protected void handleOnNewIntent(Intent intent) {
        super.handleOnNewIntent(intent);
        deliver(intent);
    }

    @Override
    protected void handleOnPause() {
        super.handleOnPause();
        PowerManager pm = (PowerManager) getContext().getSystemService(Context.POWER_SERVICE);
        // Locking the phone also pauses the app; only an unlocked screen
        // means the student went to another app.
        if (pm != null && pm.isInteractive()) awaySince = System.currentTimeMillis();
    }

    @Override
    protected void handleOnResume() {
        super.handleOnResume();
        closeAway(System.currentTimeMillis());
    }

    @Override
    protected void handleOnDestroy() {
        if (screenOff != null) {
            try {
                getContext().unregisterReceiver(screenOff);
            } catch (IllegalArgumentException ignored) {
                // Not registered.
            }
        }
        super.handleOnDestroy();
    }

    private synchronized void closeAway(long until) {
        if (awaySince > 0 && until > awaySince) away.add(new long[] {awaySince, until});
        awaySince = 0;
    }

    private void deliver(Intent intent) {
        if (intent == null) return;
        String action = intent.getStringExtra(FocusNotifier.EXTRA_ACTION);
        if (action == null) return;
        intent.removeExtra(FocusNotifier.EXTRA_ACTION);
        JSObject data = new JSObject();
        data.put("action", action);
        notifyListeners("action", data, true);
    }

    @PluginMethod
    public void schedule(PluginCall call) {
        JSArray stages = call.getArray("stages", new JSArray());
        FocusNotifier.save(getContext(), stages.toString());
        FocusNotifier.apply(getContext(), false);
        call.resolve();
    }

    @PluginMethod
    public void clear(PluginCall call) {
        FocusNotifier.clear(getContext());
        call.resolve();
    }

    @PluginMethod
    public synchronized void takeAway(PluginCall call) {
        JSArray spans = new JSArray();
        for (long[] span : away) {
            JSArray pair = new JSArray();
            pair.put(span[0]);
            pair.put(span[1]);
            spans.put(pair);
        }
        away.clear();
        JSObject result = new JSObject();
        result.put("spans", spans);
        call.resolve(result);
    }

    @PluginMethod
    public void exactAlarms(PluginCall call) {
        JSObject result = new JSObject();
        result.put("allowed", FocusNotifier.exactAlarmsAllowed(getContext()));
        call.resolve(result);
    }

    @PluginMethod
    public void openExactAlarmSettings(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            Intent intent = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM,
                    Uri.parse("package:" + getContext().getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
        }
        call.resolve();
    }

    @Override
    @PluginMethod
    public void checkPermissions(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            call.resolve(granted());
            return;
        }
        super.checkPermissions(call);
    }

    @Override
    @PluginMethod
    public void requestPermissions(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU
                || getPermissionState("notifications") == PermissionState.GRANTED) {
            call.resolve(granted());
            return;
        }
        requestPermissionForAlias("notifications", call, "permissionCallback");
    }

    @PermissionCallback
    private void permissionCallback(PluginCall call) {
        JSObject result = new JSObject();
        result.put("notifications", getPermissionState("notifications").toString());
        call.resolve(result);
        FocusNotifier.apply(getContext(), false);
    }

    private static JSObject granted() {
        JSObject result = new JSObject();
        result.put("notifications", "granted");
        return result;
    }
}
