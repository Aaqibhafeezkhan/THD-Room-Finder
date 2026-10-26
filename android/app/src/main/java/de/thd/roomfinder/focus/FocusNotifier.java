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
import android.media.AudioAttributes;
import android.net.Uri;
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
 *
 * Each alert stage names its sound (ADR 0012): "coffee_break" and the like
 * post on a channel made for that sound, so it plays with the phone locked
 * and follows silent mode and Do Not Disturb; "silent" vibrates only; no
 * sound keeps the phone's own (focus_alerts). A channel's sound is fixed
 * when it is created, hence one channel per sound.
 */
final class FocusNotifier {
    static final String EXTRA_ACTION = "focusAction";

    private static final String PREFS = "thd_focus_notifications";
    private static final String KEY_STAGES = "stages";
    private static final String CHANNEL_RUNNING = "focus_running";
    private static final String CHANNEL_ALERTS = "focus_alerts";
    private static final String CHANNEL_SILENT = "focus_silent";
    private static final int NOTIFICATION_ID = 4212;
    /** The sets with their own files (ADR 0012), and each set's three sounds. */
    private static final String[] SETS = {"coffee", "jingle", "chimes"};
    private static final String[] MOMENTS = {"break", "back", "done"};
    private static final int[][] SOUNDS = {
        {R.raw.focus_coffee_break, R.raw.focus_coffee_back, R.raw.focus_coffee_done},
        {R.raw.focus_jingle_break, R.raw.focus_jingle_back, R.raw.focus_jingle_done},
        {R.raw.focus_chimes_break, R.raw.focus_chimes_back, R.raw.focus_chimes_done},
    };
    private static final int[] SET_NAMES = {R.string.focus_sound_coffee, R.string.focus_sound_jingle, R.string.focus_sound_chimes};
    private static final int[] MOMENT_NAMES = {R.string.focus_moment_break, R.string.focus_moment_back, R.string.focus_moment_done};
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

        NotificationChannel silent = new NotificationChannel(
                CHANNEL_SILENT, ctx.getString(R.string.focus_channel_silent), NotificationManager.IMPORTANCE_HIGH);
        silent.setDescription(ctx.getString(R.string.focus_channel_silent_description));
        silent.setSound(null, null);
        silent.enableVibration(true);
        silent.setLockscreenVisibility(android.app.Notification.VISIBILITY_PUBLIC);
        nm.createNotificationChannel(silent);

        AudioAttributes attrs = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_NOTIFICATION_EVENT)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build();
        for (int s = 0; s < SETS.length; s++) {
            for (int m = 0; m < MOMENTS.length; m++) {
                NotificationChannel ch = new NotificationChannel(
                        channelFor(SETS[s] + "_" + MOMENTS[m]),
                        ctx.getString(R.string.focus_channel_sound, ctx.getString(SET_NAMES[s]), ctx.getString(MOMENT_NAMES[m])),
                        NotificationManager.IMPORTANCE_HIGH);
                ch.setDescription(ctx.getString(R.string.focus_channel_sound_description));
                ch.setSound(soundUri(ctx, SOUNDS[s][m]), attrs);
                ch.enableVibration(true);
                ch.setShowBadge(false);
                ch.setLockscreenVisibility(android.app.Notification.VISIBILITY_PUBLIC);
                nm.createNotificationChannel(ch);
            }
        }
    }

    /** The channel an alert with this sound posts on; see the class comment. */
    static String channelFor(String sound) {
        if (sound == null || sound.isEmpty()) return CHANNEL_ALERTS;
        if ("silent".equals(sound)) return CHANNEL_SILENT;
        return "focus_" + sound;
    }

    /** The raw file for "coffee_break" and the like, or 0. */
    private static int soundRes(String sound) {
        for (int s = 0; s < SETS.length; s++) {
            for (int m = 0; m < MOMENTS.length; m++) {
                if ((SETS[s] + "_" + MOMENTS[m]).equals(sound)) return SOUNDS[s][m];
            }
        }
        return 0;
    }

    private static Uri soundUri(Context ctx, int res) {
        return Uri.parse("android.resource://" + ctx.getPackageName() + "/" + res);
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
        // An alarm can fire before the app ran since an update; creating a
        // channel again is cheap and keeps any change the student made.
        ensureChannels(ctx);
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
        String sound = s.optString("sound", "");
        // An unknown sound (from a newer web bundle) falls back to the phone's own.
        String channel = !alert ? CHANNEL_RUNNING
                : "silent".equals(sound) || soundRes(sound) != 0 ? channelFor(sound) : CHANNEL_ALERTS;
        NotificationCompat.Builder b = new NotificationCompat.Builder(ctx, channel)
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
        // Before Android 8 there are no channels: the notification carries it.
        if (alert && Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            int res = soundRes(sound);
            if (res != 0) b.setSound(soundUri(ctx, res));
            else if ("silent".equals(sound)) b.setDefaults(NotificationCompat.DEFAULT_VIBRATE);
            else b.setDefaults(NotificationCompat.DEFAULT_ALL);
        }
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
