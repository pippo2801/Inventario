package com.studiodipietro.inventario;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SanitaryCardOCRPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
