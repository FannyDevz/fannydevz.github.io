package com.fanny.neolauncher;

import android.accessibilityservice.AccessibilityService;
import android.content.Intent;
import android.util.Log;
import android.view.accessibility.AccessibilityEvent;

/**
 * Mengalihkan beranda Google ke Neo Launcher tanpa mematikan launcher Google.
 * Pengaman: kalau terjadi terlalu banyak pengalihan dalam waktu singkat
 * (misalnya Neo Launcher crash), pengalihan berhenti sampai layanan dimulai ulang.
 */
public class HomeRedirectService extends AccessibilityService {
    private static final String TAG = "NeoRedirect";
    private static final String GOOGLE_HOME = "com.google.android.apps.tv.launcherx.home.HomeActivity";
    private static final long WINDOW_MS = 30_000;
    private static final int MAX_IN_WINDOW = 6;
    private static final long MIN_GAP_MS = 800;

    private long windowStart;
    private long lastRedirect;
    private int count;
    private boolean stopped;

    @Override public void onAccessibilityEvent(AccessibilityEvent event) {
        if (stopped || event.getEventType() != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return;
        CharSequence name = event.getClassName();
        if (name == null || !GOOGLE_HOME.contentEquals(name)) return;

        long now = android.os.SystemClock.elapsedRealtime();
        if (now - lastRedirect < MIN_GAP_MS) return;
        if (now - windowStart > WINDOW_MS) {
            windowStart = now;
            count = 0;
        }
        if (++count > MAX_IN_WINDOW) {
            stopped = true;
            Log.w(TAG, "Terlalu banyak pengalihan, pengalihan dihentikan");
            return;
        }
        lastRedirect = now;
        Intent intent = new Intent(this, MainActivity.class)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            startActivity(intent);
        } catch (RuntimeException e) {
            stopped = true;
            Log.w(TAG, "Gagal membuka Neo Launcher", e);
        }
    }

    @Override public void onInterrupt() { }
}
