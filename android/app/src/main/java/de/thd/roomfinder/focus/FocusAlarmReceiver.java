package de.thd.roomfinder.focus;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Moves the focus-session notification on to the stage that just began. */
public class FocusAlarmReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        FocusNotifier.ensureChannels(context);
        FocusNotifier.apply(context, true);
    }
}
