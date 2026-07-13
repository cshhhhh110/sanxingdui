package org.example.springboot.config;

import org.example.springboot.config.ImageGenerationProfileProperties.ResolvedProfile;
import org.junit.jupiter.api.Test;
import org.springframework.boot.context.properties.bind.Bindable;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.boot.env.YamlPropertySourceLoader;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.PropertySource;
import org.springframework.core.env.StandardEnvironment;
import org.springframework.core.io.ClassPathResource;

import java.io.IOException;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class ImageGenerationProfilePropertiesBindingTest {

    @Test
    void templatePreservesAspectRatioMapKeys() throws IOException {
        ConfigurableEnvironment environment = new StandardEnvironment();
        List<PropertySource<?>> sources = new YamlPropertySourceLoader()
                .load("image-generation-template", new ClassPathResource("application-template.yml"));
        sources.forEach(source -> environment.getPropertySources().addLast(source));

        ImageGenerationProfileProperties properties = Binder.get(environment)
                .bind("media-generation.image", Bindable.of(ImageGenerationProfileProperties.class))
                .orElseThrow(() -> new IllegalStateException("图片生成配置未绑定"));

        assertProfile(properties.resolve("FAST", "1:1"), "FAST", "1328x1328");
        assertProfile(properties.resolve("FAST", "16:9"), "FAST", "1664x928");
        assertProfile(properties.resolve("FAST", "9:16"), "FAST", "928x1664");
        assertProfile(properties.resolve("FAST", "4:3"), "FAST", "1472x1140");
        assertProfile(properties.resolve("FAST", "3:4"), "FAST", "1140x1472");
        assertProfile(properties.resolve("QUALITY", "1:1"), "QUALITY", "1328x1328");
    }

    private void assertProfile(ResolvedProfile profile, String name, String imageSize) {
        assertThat(profile.name()).isEqualTo(name);
        assertThat(profile.model()).isNotBlank();
        assertThat(profile.imageSize()).isEqualTo(imageSize);
    }
}
