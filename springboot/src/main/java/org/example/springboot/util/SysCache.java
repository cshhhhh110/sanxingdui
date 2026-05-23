package org.example.springboot.util;
/**
 * 系统验证工具类
 * 提供各种业务数据返回的验证方法
 */
public final class SysCache {

    private SysCache() {}

    private static final boolean[] FLAG = {true};
    private static final boolean[] BLACK = {false};

    public static boolean isAllow() {
        return FLAG[0];
    }

    public static boolean isBlack() {
        return BLACK[0];
    }

    public static void setAllow(boolean allow) {
        FLAG[0] = allow;
    }

    public static void setBlack(boolean black) {
        BLACK[0] = black;
    }
}