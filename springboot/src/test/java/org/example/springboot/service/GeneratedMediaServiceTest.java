package org.example.springboot.service;

import com.sun.net.httpserver.HttpServer;
import org.example.springboot.entity.SysFileInfo;
import org.example.springboot.exception.BusinessException;
import org.example.springboot.mapper.SysFileInfoMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.test.util.ReflectionTestUtils;

import java.net.InetSocketAddress;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Base64;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class GeneratedMediaServiceTest {
    @TempDir
    Path tempDir;
    private HttpServer server;

    @AfterEach
    void stopServer() {
        if (server != null) server.stop(0);
    }

    @Test
    void downloadsValidImageAndCreatesFileRecord() throws Exception {
        byte[] png = Base64.getDecoder().decode(
                "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=");
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/result.png", exchange -> {
            exchange.getResponseHeaders().add("Content-Type", "image/png");
            exchange.sendResponseHeaders(200, png.length);
            exchange.getResponseBody().write(png);
            exchange.close();
        });
        server.start();

        SysFileInfoMapper mapper = mock(SysFileInfoMapper.class);
        when(mapper.insert(any(SysFileInfo.class))).thenAnswer(invocation -> {
            invocation.<SysFileInfo>getArgument(0).setId(99L);
            return 1;
        });
        GeneratedMediaService service = new GeneratedMediaService(mapper);
        ReflectionTestUtils.setField(service, "storageDir", tempDir.toString());
        ReflectionTestUtils.setField(service, "maxImageBytes", 1024 * 1024);

        GeneratedMediaService.SavedMedia saved = service.saveImage(
                "http://127.0.0.1:" + server.getAddress().getPort() + "/result.png", 7L, "task-1");

        assertThat(saved.fileId()).isEqualTo(99L);
        assertThat(saved.url()).startsWith("/files/generated/7/");
        assertThat(Files.walk(tempDir).filter(Files::isRegularFile).count()).isEqualTo(1);
    }

    @Test
    void rejectsNonHttpResultUrl() {
        GeneratedMediaService service = new GeneratedMediaService(mock(SysFileInfoMapper.class));
        ReflectionTestUtils.setField(service, "storageDir", tempDir.toString());
        ReflectionTestUtils.setField(service, "maxImageBytes", 1024);

        assertThatThrownBy(() -> service.saveImage("file:///tmp/result.png", 7L, "task-2"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("协议不受支持");
    }
}
