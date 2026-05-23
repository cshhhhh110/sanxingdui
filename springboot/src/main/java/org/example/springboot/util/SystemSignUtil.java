package org.example.springboot.util;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.security.MessageDigest;

/**
 * 系统验证工具类
 * md5加密验证逻辑，避免循环依赖
 */
public final class SystemSignUtil {

    private static String machineCode;

    private SystemSignUtil() {}

    public static String getMachineCode() {
        if (machineCode != null) {
            return machineCode;
        }

        try {
            String cpuId = getCPUSerial();
            String diskId = getDiskSerial();
            String boardId = getMotherboardUUID();

            String fingerprint = cpuId + "_" + diskId + "_" + boardId;

            machineCode = md5(fingerprint).toUpperCase();
            return machineCode;

        } catch (Exception e) {
            return "MACHINE_INVALID_2025";
        }
    }

    private static String getCPUSerial() {
        try {
            String os = System.getProperty("os.name").toLowerCase();
            Process process;
            if (os.contains("win")) {
                process = Runtime.getRuntime().exec(new String[]{"wmic", "cpu", "get", "ProcessorId"});
            } else {
                process = Runtime.getRuntime().exec(new String[]{"sh", "-c", "dmidecode -s processor-id 2>/dev/null || cat /proc/cpuinfo | grep serial | head -1"});
            }
            return readProcessOutput(process);
        } catch (Exception e) {
            return "CPU_UNKNOWN";
        }
    }

    private static String getDiskSerial() {
        try {
            String os = System.getProperty("os.name").toLowerCase();
            Process process;
            if (os.contains("win")) {
                process = Runtime.getRuntime().exec(new String[]{"wmic", "diskdrive", "get", "SerialNumber"});
            } else {
                process = Runtime.getRuntime().exec(new String[]{"sh", "-c", "lsblk -o SERIAL | grep -v SERIAL | head -1 2>/dev/null"});
            }
            return readProcessOutput(process);
        } catch (Exception e) {
            return "DISK_UNKNOWN";
        }
    }

    private static String getMotherboardUUID() {
        try {
            String os = System.getProperty("os.name").toLowerCase();
            Process process;
            if (os.contains("win")) {
                process = Runtime.getRuntime().exec(new String[]{"wmic", "csproduct", "get", "UUID"});
            } else {
                process = Runtime.getRuntime().exec(new String[]{"sh", "-c", "dmidecode -s system-uuid 2>/dev/null"});
            }
            return readProcessOutput(process);
        } catch (Exception e) {
            return "BOARD_UNKNOWN";
        }
    }

    private static String readProcessOutput(Process process) throws Exception {
        process.getOutputStream().close();
        BufferedReader br = new BufferedReader(new InputStreamReader(process.getInputStream()));
        String line;
        StringBuilder sb = new StringBuilder();
        while ((line = br.readLine()) != null) {
            sb.append(line.trim());
        }
        br.close();
        process.destroy();
        return cleanValue(sb.toString());
    }

    private static String cleanValue(String s) {
        return s.replaceAll("[^a-zA-Z0-9]", "").trim();
    }

    private static String md5(String str) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] bytes = md.digest(str.getBytes());
            StringBuilder sb = new StringBuilder();
            for (byte b : bytes) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            return str;
        }
    }
}