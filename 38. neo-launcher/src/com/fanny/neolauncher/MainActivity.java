package com.fanny.neolauncher;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RectF;
import android.graphics.Typeface;
import android.graphics.drawable.Drawable;
import android.os.Bundle;
import android.text.TextUtils;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.GridLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextClock;
import android.widget.TextView;
import android.widget.Toast;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

/** Launcher Android TV bergaya neobrutalism.dev, tanpa library tambahan. */
public class MainActivity extends Activity {
    private static final int BG = 0xFF8FA3BF;
    private static final int GRID_LINE = 0x26000000;
    private static final int MAIN = 0xFF3F76D6;
    private static final int WHITE = 0xFFE4E2D8;
    private static final int BLACK = 0xFF000000;
    private static final int RED = 0xFFD9484A;
    private static final int YELLOW = 0xFFD6AE0A;
    private static final int GREEN = 0xFF0BB768;
    private static final int VIOLET = 0xFF666EDB;
    private static final int[] TILES = {RED, YELLOW, GREEN, VIOLET, MAIN};
    private static final int COLUMNS = 5;
    private static final int SIDE_DP = 34;

    /** Urutan aplikasi utama; sisanya mengikuti abjad, Settings paling akhir. */
    private static final List<String> FIRST = Arrays.asList(
            "com.netflix.ninja",
            "com.google.android.youtube.tv",
            "com.vidio.android.tv",
            "com.iqiyi.i18n.tv",
            "com.bstar.intl.tv",
            "com.mitv.livetv");
    private static final String SETTINGS = "com.android.tv.settings";
    private static final String KEY_ORDER = "order";
    private static final String HINT_PICK = "Pilih aplikasi, tekan OK untuk mengangkat";
    private static final String HINT_MOVE = "Panah: pindahkan  ·  OK: taruh";

    private Typeface regular;
    private Typeface bold;
    private GridLayout grid;
    private TextView countBadge;
    private List<String> shown = new ArrayList<>();
    private final List<App> current = new ArrayList<>();
    private boolean editing;
    private Tile moving;
    private Tile editButton;
    private Tile resetButton;
    private IconView editIcon;
    private TextView hint;

    private final BroadcastReceiver packagesChanged = new BroadcastReceiver() {
        @Override public void onReceive(Context context, Intent intent) {
            reload();
        }
    };

    @Override protected void onCreate(Bundle state) {
        super.onCreate(state);
        regular = font(500);
        bold = font(700);

        FrameLayout root = new FrameLayout(this);
        root.addView(new GridBackground(this));

        LinearLayout column = new LinearLayout(this);
        column.setOrientation(LinearLayout.VERTICAL);
        column.addView(navbar());

        ScrollView scroll = new ScrollView(this);
        scroll.setVerticalScrollBarEnabled(false);
        scroll.setClipToPadding(false);
        scroll.setPadding(dp(SIDE_DP), dp(30), dp(SIDE_DP), dp(16));
        scroll.setFocusable(false);
        grid = new GridLayout(this);
        grid.setColumnCount(COLUMNS);
        scroll.addView(grid, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));
        column.addView(scroll, new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));
        root.addView(column);
        setContentView(root);

        IntentFilter filter = new IntentFilter();
        filter.addAction(Intent.ACTION_PACKAGE_ADDED);
        filter.addAction(Intent.ACTION_PACKAGE_REMOVED);
        filter.addAction(Intent.ACTION_PACKAGE_CHANGED);
        filter.addDataScheme("package");
        registerReceiver(packagesChanged, filter);
    }

    @Override protected void onResume() {
        super.onResume();
        reload();
    }

    @Override protected void onDestroy() {
        unregisterReceiver(packagesChanged);
        super.onDestroy();
    }

    @Override protected void onPause() {
        setEditing(false);
        super.onPause();
    }

    /** Back hanya keluar dari mode atur; di beranda biasa tidak melakukan apa-apa. */
    @Override public void onBackPressed() {
        if (moving != null) {
            setMoving(null);
        } else if (editing) {
            setEditing(false);
        }
    }

    /** Saat aplikasi sedang diangkat, tombol panah memindahkannya, bukan memindah fokus. */
    @Override public boolean dispatchKeyEvent(KeyEvent event) {
        if (moving != null) {
            int delta = 0;
            switch (event.getKeyCode()) {
                case KeyEvent.KEYCODE_DPAD_LEFT: delta = -1; break;
                case KeyEvent.KEYCODE_DPAD_RIGHT: delta = 1; break;
                case KeyEvent.KEYCODE_DPAD_UP: delta = -COLUMNS; break;
                case KeyEvent.KEYCODE_DPAD_DOWN: delta = COLUMNS; break;
                default: break;
            }
            if (delta != 0) {
                if (event.getAction() == KeyEvent.ACTION_DOWN) moveBy(delta);
                return true;
            }
        }
        return super.dispatchKeyEvent(event);
    }

    private void setEditing(boolean value) {
        if (editButton == null || editing == value) return;
        editing = value;
        moving = null;
        editIcon.setKind(value ? IconView.CHECK : IconView.SORT);
        editButton.setContentDescription(value ? "Selesai" : "Atur urutan");
        resetButton.setVisibility(value ? View.VISIBLE : View.GONE);
        hint.setVisibility(value ? View.VISIBLE : View.INVISIBLE);
        hint.setText(HINT_PICK);
        if (grid.getChildCount() > 0) grid.getChildAt(0).requestFocus();
        restyleCards();
    }

    private void setMoving(Tile card) {
        moving = card;
        hint.setText(card != null ? HINT_MOVE : HINT_PICK);
        restyleCards();
    }

    private void restyleCards() {
        for (int i = 0; i < grid.getChildCount(); i++) ((Tile) grid.getChildAt(i)).restyle(this);
    }

    private void moveBy(int delta) {
        int from = grid.indexOfChild(moving);
        int to = from + delta;
        if (to < 0 || (Math.abs(delta) == 1 && to >= current.size())) return;
        to = Math.min(to, current.size() - 1);
        if (to == from) return;
        Tile card = moving;
        current.add(to, current.remove(from));
        ViewGroup.LayoutParams lp = card.getLayoutParams();
        grid.removeViewAt(from);
        grid.addView(card, to, lp);
        card.requestFocus();
        saveOrder();
    }

    private void saveOrder() {
        List<String> names = new ArrayList<>();
        for (App app : current) names.add(app.pkg);
        shown = names;
        prefs().edit().putString(KEY_ORDER, TextUtils.join(",", names)).apply();
    }

    private void resetOrder() {
        prefs().edit().remove(KEY_ORDER).apply();
        moving = null;
        hint.setText(HINT_PICK);
        shown = new ArrayList<>();
        reload();
    }

    private SharedPreferences prefs() {
        return getSharedPreferences("neo", MODE_PRIVATE);
    }

    /** Tombol ikon di header; namanya tampil di header saat dipilih. */
    private Tile iconButton(int kind, String name, View.OnClickListener action) {
        Tile button = new Tile(this, WHITE, 3, 3, 2);
        button.setPadding(dp(7), dp(7), dp(10), dp(10));
        button.setFocusable(true);
        button.setClickable(true);
        button.setContentDescription(name);
        button.addView(new IconView(this, kind), new LinearLayout.LayoutParams(dp(18), dp(18)));
        button.setOnFocusChangeListener((v, focused) -> {
            button.setFill(focused ? MAIN : WHITE);
            v.invalidate();
            if (focused) {
                hint.setText(v.getContentDescription());
                hint.setVisibility(View.VISIBLE);
            } else {
                restoreHint();
            }
        });
        button.setOnClickListener(action);
        return button;
    }

    private void restoreHint() {
        hint.setText(moving != null ? HINT_MOVE : HINT_PICK);
        hint.setVisibility(editing ? View.VISIBLE : View.INVISIBLE);
    }

    private LinearLayout.LayoutParams iconLp() {
        LinearLayout.LayoutParams lp = wrap();
        lp.rightMargin = dp(7);
        return lp;
    }

    private void openScreen(String text, String pkg, String activity) {
        Intent intent = new Intent().setClassName(pkg, activity);
        try {
            startActivity(intent);
        } catch (ActivityNotFoundException | SecurityException e) {
            Toast.makeText(this, "Tidak bisa membuka " + text, Toast.LENGTH_SHORT).show();
        }
    }

    /** Navbar putih dengan garis hitam tebal di bawahnya. */
    private View navbar() {
        LinearLayout bar = new LinearLayout(this);
        bar.setOrientation(LinearLayout.VERTICAL);
        bar.setBackgroundColor(WHITE);

        LinearLayout row = new LinearLayout(this);
        row.setGravity(Gravity.CENTER_VERTICAL);
        row.setPadding(dp(16), 0, dp(16), 0);

        TextView logo = label("N", 17, bold);
        logo.setGravity(Gravity.CENTER);
        logo.setBackground(new BoxDrawable(MAIN, dpf(2), 0));
        row.addView(logo, new LinearLayout.LayoutParams(dp(26), dp(26)));

        TextView home = label("Beranda", 14, regular);
        LinearLayout.LayoutParams homeLp = wrap();
        homeLp.leftMargin = dp(28);
        row.addView(home, homeLp);

        TextView apps = label("Aplikasi", 14, regular);
        LinearLayout.LayoutParams appsLp = wrap();
        appsLp.leftMargin = dp(28);
        row.addView(apps, appsLp);

        countBadge = label("0", 9, bold);
        countBadge.setGravity(Gravity.CENTER);
        countBadge.setPadding(dp(6), dp(1), dp(6), dp(1));
        countBadge.setBackground(new BoxDrawable(YELLOW, dpf(1.5f), 0));
        LinearLayout.LayoutParams badgeLp = wrap();
        badgeLp.leftMargin = dp(6);
        row.addView(countBadge, badgeLp);

        hint = label(HINT_PICK, 12, regular);
        hint.setGravity(Gravity.CENTER);
        hint.setVisibility(View.INVISIBLE);
        row.addView(hint, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));

        resetButton = iconButton(IconView.RESET, "Reset urutan", v -> resetOrder());
        resetButton.setVisibility(View.GONE);
        row.addView(resetButton, iconLp());

        editButton = iconButton(IconView.SORT, "Atur urutan", v -> setEditing(!editing));
        editIcon = (IconView) editButton.getChildAt(0);
        row.addView(editButton, iconLp());

        String settings = "com.android.tv.settings";
        row.addView(iconButton(IconView.WIFI, "Jaringan", v -> openScreen("Jaringan", settings,
                settings + ".connectivity.NetworkActivity")), iconLp());
        row.addView(iconButton(IconView.INPUT, "Input", v -> openScreen("Input", "com.mitv.livetv",
                "com.mitv.livetv.input.SelectInputActivity")), iconLp());
        row.addView(iconButton(IconView.SUN, "Kecerahan", v -> openScreen("Kecerahan", settings,
                settings + ".partnercustomizer.picture.PictureActivity")), iconLp());
        row.addView(iconButton(IconView.MOON, "Timer sleep", v -> openScreen("Timer sleep", settings,
                settings + ".partnercustomizer.timer.TimerActivity")), iconLp());

        Tile pill = new Tile(this, WHITE, 3, 3, 2);
        pill.setPadding(dp(10), dp(4), dp(10) + dp(3), dp(4) + dp(3));
        TextClock clock = new TextClock(this);
        clock.setFormat24Hour("EEE, d MMM  HH:mm");
        clock.setFormat12Hour("EEE, d MMM  HH:mm");
        clock.setTextColor(BLACK);
        clock.setTypeface(bold);
        clock.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12);
        pill.addView(clock);
        row.addView(pill);

        bar.addView(row, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(50)));
        View line = new View(this);
        line.setBackgroundColor(BLACK);
        bar.addView(line, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(3)));
        return bar;
    }

    private LinearLayout.LayoutParams wrap() {
        return new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
    }

    private void reload() {
        PackageManager pm = getPackageManager();
        Intent query = new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LEANBACK_LAUNCHER);
        List<ResolveInfo> found = pm.queryIntentActivities(query, 0);
        List<App> apps = new ArrayList<>();
        List<String> names = new ArrayList<>();
        for (ResolveInfo info : found) {
            String pkg = info.activityInfo.packageName;
            if (pkg.equals(getPackageName()) || names.contains(pkg)) continue;
            names.add(pkg);
            apps.add(new App(pkg, String.valueOf(info.loadLabel(pm)), info));
        }
        String saved = prefs().getString(KEY_ORDER, "");
        List<String> order = saved.isEmpty() ? new ArrayList<>() : Arrays.asList(saved.split(","));
        Collections.sort(apps, (a, b) -> {
            int rank = rank(a.pkg, order) - rank(b.pkg, order);
            return rank != 0 ? rank : a.label.compareToIgnoreCase(b.label);
        });
        names.clear();
        for (App app : apps) names.add(app.pkg);
        if (names.equals(shown)) return;
        shown = names;
        countBadge.setText(String.valueOf(apps.size()));
        render(apps);
    }

    /** Urutan tersimpan didahulukan; aplikasi baru masuk setelahnya memakai urutan bawaan. */
    private int rank(String pkg, List<String> order) {
        int saved = order.indexOf(pkg);
        if (saved >= 0) return saved;
        int index = FIRST.indexOf(pkg);
        if (index >= 0) return 10000 + index;
        return pkg.equals(SETTINGS) ? 11000 : 10500;
    }

    private void render(List<App> apps) {
        moving = null;
        current.clear();
        current.addAll(apps);
        grid.removeAllViews();
        int width = getResources().getDisplayMetrics().widthPixels - dp(SIDE_DP * 2);
        int cell = width / COLUMNS;
        int height = Math.round((cell - dp(Tile.CARD_RESERVE_DP)) * 9f / 16f) + dp(25 + Tile.CARD_RESERVE_DP);
        for (int i = 0; i < apps.size(); i++) {
            GridLayout.LayoutParams lp = new GridLayout.LayoutParams();
            lp.width = cell;
            lp.height = height;
            grid.addView(card(apps.get(i), i), lp);
        }
        if (grid.getChildCount() > 0) grid.getChildAt(0).requestFocus();
    }

    /** Kartu: gambar penuh di atas, garis hitam, lalu bilah nama yang membiru saat dipilih. */
    private View card(App app, int position) {
        Tile card = new Tile(this, WHITE, 4, Tile.CARD_RESERVE_DP, 2.5f);
        card.setFocusable(true);
        card.setClickable(true);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setPadding(0, 0, dp(Tile.CARD_RESERVE_DP), dp(Tile.CARD_RESERVE_DP));
        card.setContentDescription(app.label);

        FrameLayout art = new FrameLayout(this);
        Drawable banner = banner(app);
        art.setBackgroundColor(banner != null ? WHITE : TILES[position % TILES.length]);
        ImageView image = new ImageView(this);
        image.setScaleType(banner != null ? ImageView.ScaleType.CENTER_CROP : ImageView.ScaleType.CENTER_INSIDE);
        image.setImageDrawable(banner != null ? banner : app.info.loadIcon(getPackageManager()));
        art.addView(image, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        card.addView(art, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));

        View line = new View(this);
        line.setBackgroundColor(BLACK);
        card.addView(line, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(2)));

        TextView name = label(app.label, 12, bold);
        name.setSingleLine(true);
        name.setEllipsize(TextUtils.TruncateAt.END);
        name.setGravity(Gravity.CENTER_VERTICAL);
        name.setPadding(dp(8), 0, dp(8), 0);
        name.setBackgroundColor(WHITE);
        card.addView(name, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(23)));

        card.nameView = name;
        card.setOnFocusChangeListener((v, focused) -> {
            card.restyle(this);
            v.invalidate();
        });
        card.setOnClickListener(v -> {
            if (editing) {
                setMoving(moving == card ? null : card);
            } else {
                open(app);
            }
        });
        return card;
    }

    /** Banner TV (16:9) lebih cocok untuk kartu; ikon biasa hanya sebagai cadangan. */
    private Drawable banner(App app) {
        PackageManager pm = getPackageManager();
        Drawable result = app.info.activityInfo.loadBanner(pm);
        if (result != null) return result;
        try {
            ApplicationInfo info = pm.getApplicationInfo(app.pkg, 0);
            return info.loadBanner(pm);
        } catch (PackageManager.NameNotFoundException e) {
            return null;
        }
    }

    private void open(App app) {
        PackageManager pm = getPackageManager();
        Intent intent = pm.getLeanbackLaunchIntentForPackage(app.pkg);
        if (intent == null) intent = pm.getLaunchIntentForPackage(app.pkg);
        try {
            if (intent == null) throw new ActivityNotFoundException();
            startActivity(intent);
        } catch (ActivityNotFoundException | SecurityException e) {
            Toast.makeText(this, "Tidak bisa membuka " + app.label, Toast.LENGTH_SHORT).show();
        }
    }

    private TextView label(String text, int sp, Typeface face) {
        TextView view = new TextView(this);
        view.setText(text);
        view.setTextColor(BLACK);
        view.setTypeface(face);
        view.setIncludeFontPadding(false);
        view.setTextSize(TypedValue.COMPLEX_UNIT_SP, sp);
        return view;
    }

    private Typeface font(int weight) {
        try {
            return new Typeface.Builder(getAssets(), "dmsans.ttf")
                    .setFontVariationSettings("'wght' " + weight)
                    .build();
        } catch (RuntimeException e) {
            return Typeface.DEFAULT_BOLD;
        }
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    private float dpf(float value) {
        return value * getResources().getDisplayMetrics().density;
    }

    private static final class App {
        final String pkg;
        final String label;
        final ResolveInfo info;

        App(String pkg, String label, ResolveInfo info) {
            this.pkg = pkg;
            this.label = label;
            this.info = info;
        }
    }

    /** Latar biru muda berpola kotak-kotak, dengan bintang di kedua sudut bawah. */
    private static final class GridBackground extends View {
        private final Paint line = new Paint();
        private final float density;

        GridBackground(Context context) {
            super(context);
            density = context.getResources().getDisplayMetrics().density;
            line.setColor(GRID_LINE);
            line.setStrokeWidth(1);
        }

        @Override protected void onDraw(Canvas canvas) {
            canvas.drawColor(BG);
            float step = 53 * density;
            for (float x = step; x < getWidth(); x += step) canvas.drawLine(x, 0, x, getHeight(), line);
            for (float y = step; y < getHeight(); y += step) canvas.drawLine(0, y, getWidth(), y, line);
            float r = 26 * density;
            StarView.draw(canvas, 0, getHeight(), r, VIOLET, 1.6f * density);
            StarView.draw(canvas, getWidth(), getHeight(), r, GREEN, 1.6f * density);
        }
    }

    /** Bintang runcing dengan garis tepi hitam. */
    private static final class StarView {
        static void draw(Canvas canvas, float cx, float cy, float radius, int color, float stroke) {
            final int spikes = 14;
            Path path = new Path();
            for (int i = 0; i < spikes * 2; i++) {
                float r = i % 2 == 0 ? radius : radius * 0.3f;
                double angle = Math.PI * i / spikes;
                float x = cx + (float) (Math.cos(angle) * r);
                float y = cy + (float) (Math.sin(angle) * r);
                if (i == 0) path.moveTo(x, y); else path.lineTo(x, y);
            }
            path.close();
            Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
            paint.setColor(color);
            canvas.drawPath(path, paint);
            paint.setStyle(Paint.Style.STROKE);
            paint.setStrokeWidth(stroke);
            paint.setColor(BLACK);
            canvas.drawPath(path, paint);
        }
    }

    /** Ikon garis tebal yang digambar langsung, tanpa file gambar. */
    private static final class IconView extends View {
        static final int WIFI = 0, INPUT = 1, SUN = 2, MOON = 3, SORT = 4, CHECK = 5, RESET = 6;
        private final Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final Path path = new Path();
        private final RectF oval = new RectF();
        private int kind;

        IconView(Context context, int kind) {
            super(context);
            this.kind = kind;
        }

        void setKind(int kind) {
            this.kind = kind;
            invalidate();
        }

        private void line(Canvas c, float u, float x1, float y1, float x2, float y2) {
            c.drawLine(x1 * u, y1 * u, x2 * u, y2 * u, paint);
        }

        private void arc(Canvas c, float u, float cx, float cy, float r, float start, float sweep) {
            oval.set((cx - r) * u, (cy - r) * u, (cx + r) * u, (cy + r) * u);
            c.drawArc(oval, start, sweep, false, paint);
        }

        @Override protected void onDraw(Canvas c) {
            float u = getWidth() / 24f;
            paint.setColor(BLACK);
            paint.setStyle(Paint.Style.STROKE);
            paint.setStrokeWidth(2.6f * u);
            paint.setStrokeCap(Paint.Cap.SQUARE);
            paint.setStrokeJoin(Paint.Join.MITER);
            switch (kind) {
                case WIFI:
                    arc(c, u, 12, 20, 16, 225, 90);
                    arc(c, u, 12, 20, 10, 225, 90);
                    arc(c, u, 12, 20, 4.5f, 225, 90);
                    break;
                case INPUT:
                    c.drawRect(9 * u, 3 * u, 22 * u, 21 * u, paint);
                    line(c, u, 2, 12, 14, 12);
                    line(c, u, 10, 8, 14, 12);
                    line(c, u, 10, 16, 14, 12);
                    break;
                case SUN:
                    c.drawCircle(12 * u, 12 * u, 4.5f * u, paint);
                    for (int i = 0; i < 8; i++) {
                        double a = Math.PI * i / 4;
                        line(c, u, 12 + (float) Math.cos(a) * 8.5f, 12 + (float) Math.sin(a) * 8.5f,
                                12 + (float) Math.cos(a) * 11f, 12 + (float) Math.sin(a) * 11f);
                    }
                    break;
                case MOON:
                    path.reset();
                    path.addCircle(11 * u, 13 * u, 9 * u, Path.Direction.CW);
                    Path cut = new Path();
                    cut.addCircle(17 * u, 8 * u, 8 * u, Path.Direction.CW);
                    path.op(cut, Path.Op.DIFFERENCE);
                    c.drawPath(path, paint);
                    break;
                case SORT:
                    line(c, u, 7, 4, 7, 20);
                    line(c, u, 3, 8, 7, 4);
                    line(c, u, 11, 8, 7, 4);
                    line(c, u, 17, 4, 17, 20);
                    line(c, u, 13, 16, 17, 20);
                    line(c, u, 21, 16, 17, 20);
                    break;
                case CHECK:
                    line(c, u, 4, 13, 10, 19);
                    line(c, u, 10, 19, 20, 6);
                    break;
                default:
                    arc(c, u, 12, 13, 8.5f, 300, 300);
                    line(c, u, 16, 2, 16.5f, 6);
                    line(c, u, 16.5f, 6, 12.5f, 6.5f);
                    break;
            }
        }
    }

    /** Kotak sederhana: isi warna, border hitam, sudut membulat kecil. */
    private static final class BoxDrawable extends Drawable {
        private final Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final RectF rect = new RectF();
        private final int fill;
        private final float border;
        private final float radius;

        BoxDrawable(int fill, float border, float radius) {
            this.fill = fill;
            this.border = border;
            this.radius = radius;
        }

        @Override public void draw(Canvas canvas) {
            rect.set(getBounds());
            rect.inset(border / 2, border / 2);
            paint.setStyle(Paint.Style.FILL);
            paint.setColor(fill);
            canvas.drawRoundRect(rect, radius, radius, paint);
            paint.setStyle(Paint.Style.STROKE);
            paint.setStrokeWidth(border);
            paint.setColor(BLACK);
            canvas.drawRoundRect(rect, radius, radius, paint);
        }

        @Override public void setAlpha(int alpha) { }
        @Override public void setColorFilter(android.graphics.ColorFilter filter) { }
        @Override public int getOpacity() { return android.graphics.PixelFormat.TRANSLUCENT; }
    }

    /** Kotak neobrutalism: border hitam, sudut kecil, bayangan keras tanpa blur. */
    private static final class Tile extends LinearLayout {
        static final int CARD_RESERVE_DP = 9;
        private final Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final RectF rect = new RectF();
        private final Path clip = new Path();
        private final float density;
        private int fill;
        TextView nameView;
        private final int shadowDp;
        private final int reserveDp;
        private final float borderDp;

        Tile(Context context, int fill, int shadowDp, int reserveDp, float borderDp) {
            super(context);
            this.fill = fill;
            this.shadowDp = shadowDp;
            this.reserveDp = reserveDp;
            this.borderDp = borderDp;
            density = context.getResources().getDisplayMetrics().density;
            setWillNotDraw(false);
        }

        void setFill(int color) {
            fill = color;
        }

        /** Biru saat dipilih, hijau saat mode atur, kuning saat sedang diangkat. */
        void restyle(MainActivity activity) {
            if (nameView == null) return;
            int color = WHITE;
            if (activity.moving == this) {
                color = YELLOW;
            } else if (isFocused()) {
                color = activity.editing ? GREEN : MAIN;
            }
            nameView.setBackgroundColor(color);
            invalidate();
        }

        @Override protected void onDraw(Canvas canvas) {
            float reserve = reserveDp * density;
            float offset = (isFocused() ? reserveDp : shadowDp) * density;
            float radius = 0;
            float right = getWidth() - reserve;
            float bottom = getHeight() - reserve;

            paint.setStyle(Paint.Style.FILL);
            paint.setColor(BLACK);
            rect.set(offset, offset, right + offset, bottom + offset);
            canvas.drawRoundRect(rect, radius, radius, paint);

            paint.setColor(fill);
            rect.set(0, 0, right, bottom);
            canvas.drawRoundRect(rect, radius, radius, paint);
        }

        /** Anak-anak dipotong mengikuti sudut, lalu border digambar paling atas. */
        @Override protected void dispatchDraw(Canvas canvas) {
            float reserve = reserveDp * density;
            float radius = 0;
            float border = (isFocused() ? borderDp + 1 : borderDp) * density;
            rect.set(0, 0, getWidth() - reserve, getHeight() - reserve);
            clip.reset();
            clip.addRoundRect(rect, radius, radius, Path.Direction.CW);
            int save = canvas.save();
            canvas.clipPath(clip);
            super.dispatchDraw(canvas);
            canvas.restoreToCount(save);

            paint.setStyle(Paint.Style.STROKE);
            paint.setStrokeWidth(border);
            paint.setColor(BLACK);
            rect.inset(border / 2, border / 2);
            canvas.drawRoundRect(rect, radius, radius, paint);
        }
    }
}
