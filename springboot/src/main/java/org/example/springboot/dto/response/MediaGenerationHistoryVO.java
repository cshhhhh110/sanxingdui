package org.example.springboot.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class MediaGenerationHistoryVO {
    private long total;
    private long pageNum;
    private long pageSize;
    private List<MediaGenerationTaskVO> records;
}
