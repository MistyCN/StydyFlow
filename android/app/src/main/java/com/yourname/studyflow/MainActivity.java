package com.yourname.studyflow;

import android.os.Bundle;
import android.graphics.Color;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SettingsBridgePlugin.class);
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(Color.parseColor("#f2f2f7"));
        getWindow().getDecorView().setSystemUiVisibility(android.view.View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR);
    }
}
