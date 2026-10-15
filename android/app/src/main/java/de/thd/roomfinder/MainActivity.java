package de.thd.roomfinder;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

import de.thd.roomfinder.focus.FocusNotificationPlugin;
import de.thd.roomfinder.update.AppUpdatePlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // App-local plugins register before the bridge starts.
        registerPlugin(FocusNotificationPlugin.class);
        registerPlugin(AppUpdatePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
