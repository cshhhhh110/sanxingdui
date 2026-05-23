package org.example.springboot.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

@Data
@Schema(description = "竞赛文物卡片响应")
public class CompetitionArtifactResponseDTO {

    @Schema(description = "实体主键")
    private String entityId;

    @Schema(description = "原标题")
    private String title;

    @Schema(description = "展示标题")
    private String displayTitle;

    @Schema(description = "类别")
    private String category;

    @Schema(description = "地区")
    private String region;

    @Schema(description = "遗址编码")
    private String siteCode;

    @Schema(description = "遗址英文名")
    private String siteName;

    @Schema(description = "遗址中文名")
    private String siteNameZh;

    @Schema(description = "遗址展示名")
    private String siteLabel;

    @Schema(description = "时代编码")
    private String eraCode;

    @Schema(description = "时代英文名")
    private String eraName;

    @Schema(description = "时代中文名")
    private String eraNameZh;

    @Schema(description = "时代展示名")
    private String eraLabel;

    @Schema(description = "开始年份")
    private Integer timeStartYear;

    @Schema(description = "结束年份")
    private Integer timeEndYear;

    @Schema(description = "年份展示文案")
    private String yearLabel;

    @Schema(description = "工艺编码数组")
    private List<String> craftCodes;

    @Schema(description = "工艺中文名数组")
    private List<String> craftNamesZh;

    @Schema(description = "工艺展示文案")
    private String craftLabel;

    @Schema(description = "摘要")
    private String summary;

    @Schema(description = "说明")
    private String description;

    @Schema(description = "象征寓意首项")
    private String symbolicMeaning;

    @Schema(description = "象征寓意数组")
    private List<String> symbolicMeaningZh;

    @Schema(description = "模型地址")
    private String resolvedGlbUrl;

    @Schema(description = "封面图")
    private String coverImage;

    @Schema(description = "卡片图")
    private String cardImage;

    @Schema(description = "模型状态")
    private String modelStatus;

    @Schema(description = "模型是否可用")
    private Boolean isModelReady;
}
