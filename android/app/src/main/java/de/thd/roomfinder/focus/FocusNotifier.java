package de.thd.roomfinder.focus;

import android.Manifest;
import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import de.thd.roomfinder.R;

/**
 * The running focus-session notification (ADR 0004 §7). The web app hands
 * over a list of stages (block, break, "Break's over", done), each shown from
 * its start time; the stages are kept in shared preferences and an alarm
 * moves the notification on to the next stage, so it keeps up with the
 * session while the app is closed. The countdown is drawn by the system
 * (a chronometer), so nothing has to run in between. The notification is
 * public on the lock screen: it only carries the room code and the phase.
 */
final class FocusNotifier {
    static final String EXTRA_ACTION = "focusAction";

    private static final String PREFS = "thd_focus_notifications";
    private static final String KEY_STAGES = "stages";
    private static final String CHANNEL_RUNNING = "focus_running";
    private static final String CHANNEL_ALERTS = "focus_alerts";
    private static final int NOTIFICATION_ID = 4212;
    private static final int COLOR_FOCUS = 0xFF6A4BA8;

    private FocusNotifier() {}

    static void ensureChannels(Context ctx) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager nm = ctx.getSystemService(NotificationManager.class);
        NotificationChannel running = new NotificationChannel(
                CHANNEL_RUNNING, ctx.getString(R.string.focus_channel_running), NotificationManager.IMPORTANCE_LOW);
        running.setDescription(ctx.getString(R.string.focus_channel_running_description));
        running.setShowBadge(false);
        running.setLockscreenVisibility(android.app.Notification.VISIBILITY_PUBLIC);
        NotificationChannel alerts = new NotificationChannel(
                CHANNEL_ALERTS, ctx.getString(R.string.focus_channel_alerts), NotificationManager.IMPORTANCE_HIGH);
        alerts.setDescription(ctx.getString(R.string.focus_channel_alerts_description));
        alerts.enableVibration(true);
        alerts.setLockscreenVisibility(android.app.Notification.VISIBILITY_PUBLIC);
        nm.createNotificationChannel(running);
        nm.createNotificationChannel(alerts);
    }

    static void save(Context ctx, String stages) {
        prefs(ctx).edit().putString(KEY_STAGES, stages).apply();
    }

    static void clear(Context ctx) {
        prefs(ctx).edit().remove(KEY_STAGES).apply();
        alarms(ctx).cancel(alarmIntent(ctx));
        NotificationManagerCompat.from(ctx).cancel(NOTIFICATION_ID);
    }

    /** Shows the stage that has begun and arms an alarm for the next one. */
    static void apply(Context ctx, boolean fromAlarm) {
        JSONArray stages;
        try {
            stages = new JSONArray(prefs(ctx).getString(KEY_STAGES, "[]"));
        } catch (JSONException e) {
            stages = new JSONArray();
        }
        long now = System.currentTimeMillis();
        int current = -1;
        for (int i = 0; i < stages.length(); i++) {
            JSONObject s = stages.optJSONObject(i);
            if (s != null && s.optLong("at") <= now) current = i;
        }
        if (current >= 0) {
            JSONObject s = stages.optJSONObject(current);
            show(ctx, s, fromAlarm && s.optBoolean("alert"));
        } else {
            NotificationManagerCompat.from(ctx).cancel(NOTIFICATION_ID);
        }
        int next = current + 1;
        if (next < stages.length()) arm(ctx, stages.optJSONObject(next).optLong("at"));
        else alarms(ctx).cancel(alarmIntent(ctx));
    }

    static boolean exactAlarmsAllowed(Context ctx) {
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.S || alarms(ctx).canScheduleExactAlarms();
    }

    private static void show(Context ctx, JSONObject s, boolean alert) {
        NotificationManagerCompat nm = NotificationManagerCompat.from(ctx);
        if (s.optBoolean("clear")) {
            nm.cancel(NOTIFICATION_ID);
            return;
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
                && ContextCompat.checkSelfPermission(ctx, Manifest.permission.POST_NOTIFICATIONS)
                        != PackageManager.PERMISSION_GRANTED) {
            return;
        }
        boolean ongoing = s.optBoolean("ongoing", true);
        NotificationCompat.Builder b = new NotificationCompat.Builder(ctx, alert ? CHANNEL_ALERTS : CHANNEL_RUNNING)
                .setSmallIcon(R.drawable.ic_stat_focus)
                .setColor(COLOR_FOCUS)
                .setContentTitle(s.optString("title"))
                .setContentText(s.optString("text"))
                .setOngoing(ongoing)
                .setAutoCancel(!ongoing)
                .setOnlyAlertOnce(!alert)
                .setSilent(!alert)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setCategory(NotificationCompat.CATEGORY_PROGRESS)
                .setPriority(alert ? NotificationCompat.PRIORITY_HIGH : NotificationCompat.PRIORITY_LOW)
                .setContentIntent(launch(ctx, null, 0));
        long countdownTo = s.optLong("countdownTo");
        long countUpFrom = s.optLong("countUpFrom");
        if (countdownTo > 0) {
            b.setWhen(countdownTo).setShowWhen(true).setUsesChronometer(true).setChronometerCountDown(true);
        } else if (countUpFrom > 0) {
            b.setWhen(countUpFrom).setShowWhen(true).setUsesChronometer(true);
        }
        String confirm = s.optString("confirmLabel", "");
        if (!confirm.isEmpty()) b.addAction(0, confirm, launch(ctx, "confirm", 1));
        String end = s.optString("endLabel", "");
        if (ongoing && !end.isEmpty()) b.addAction(0, end, launch(ctx, "end", 2));
        nm.notify(NOTIFICATION_ID, b.build());
    }

    private static PendingIntent launch(Context ctx, String action, int requestCode) {
        Intent intent = ctx.getPackageManager().getLaunchIntentForPackage(ctx.getPackageName());
        if (intent == null) intent = new Intent();
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        if (action != null) intent.putExtra(EXTRA_ACTION, action);
        return PendingIntent.getActivity(
                ctx, requestCode, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private static void arm(Context ctx, long at) {
        AlarmManager am = alarms(ctx);
        PendingIntent pi = alarmIntent(ctx);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (exactAlarmsAllowed(ctx)) am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
            else am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
        } else {
            am.setExact(AlarmManager.RTC_WAKEUP, at, pi);
        }
    }

    private static PendingIntent alarmIntent(Context ctx) {
        return PendingIntent.getBroadcast(
                ctx, 0, new Intent(ctx, FocusAlarmReceiver.class),
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private static AlarmManager alarms(Context ctx) {
        return (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
    }

    private static SharedPreferences prefs(Context ctx) {
        return ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }
}
