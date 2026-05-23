package org.example.springboot.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.example.springboot.dto.command.QuizRecordSubmitDTO;
import org.example.springboot.dto.response.QuizRecordResponseDTO;
import org.example.springboot.entity.QuizRecord;
import org.example.springboot.entity.User;
import org.example.springboot.exception.BusinessException;
import org.example.springboot.mapper.QuizRecordMapper;
import org.example.springboot.mapper.UserMapper;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
public class QuizRecordService {

    @Resource
    private QuizRecordMapper quizRecordMapper;

    @Resource
    private UserMapper userMapper;

    public void submitRecord(Long userId, QuizRecordSubmitDTO dto) {
        if (userId == null) {
            throw new BusinessException("用户未登录");
        }
        QuizRecord record = QuizRecord.builder()
                .userId(userId)
                .score(dto.getScore())
                .totalTime(dto.getTotalTime())
                .correctCount(dto.getCorrectCount())
                .totalCount(dto.getTotalCount())
                .mode(dto.getMode())
                .build();
        quizRecordMapper.insert(record);
        log.info("答题记录已保存: userId={}, score={}, mode={}", userId, dto.getScore(), dto.getMode());
    }

    public List<QuizRecordResponseDTO> getRanking(String mode, int limit) {
        LambdaQueryWrapper<QuizRecord> wrapper = Wrappers.lambdaQuery();
        wrapper.eq(QuizRecord::getMode, mode)
                .orderByDesc(QuizRecord::getScore)
                .orderByAsc(QuizRecord::getTotalTime);
        List<QuizRecord> allRecords = quizRecordMapper.selectList(wrapper);

        Map<Long, QuizRecord> bestMap = new java.util.LinkedHashMap<>();
        for (QuizRecord r : allRecords) {
            bestMap.putIfAbsent(r.getUserId(), r);
        }

        List<Long> userIds = new ArrayList<>(bestMap.keySet());
        if (userIds.isEmpty()) {
            return new ArrayList<>();
        }

        Map<Long, User> userMap = userMapper.selectBatchIds(userIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        List<QuizRecordResponseDTO> result = new ArrayList<>();
        int rank = 1;
        for (Map.Entry<Long, QuizRecord> entry : bestMap.entrySet()) {
            if (result.size() >= limit) break;
            QuizRecord record = entry.getValue();
            User user = userMap.get(entry.getKey());
            QuizRecordResponseDTO dto = toResponseDTO(record, user);
            dto.setRanking(rank++);
            result.add(dto);
        }
        return result;
    }

    public List<QuizRecordResponseDTO> getUserHistory(Long userId) {
        if (userId == null) {
            throw new BusinessException("用户未登录");
        }
        LambdaQueryWrapper<QuizRecord> wrapper = Wrappers.lambdaQuery();
        wrapper.eq(QuizRecord::getUserId, userId)
                .orderByDesc(QuizRecord::getCreateTime);
        List<QuizRecord> records = quizRecordMapper.selectList(wrapper);

        User user = userMapper.selectById(userId);

        return records.stream().map(r -> toResponseDTO(r, user)).collect(Collectors.toList());
    }

    private QuizRecordResponseDTO toResponseDTO(QuizRecord record, User user) {
        QuizRecordResponseDTO dto = new QuizRecordResponseDTO();
        dto.setId(record.getId());
        dto.setUserId(record.getUserId());
        dto.setUsername(user != null ? user.getUsername() : "未知用户");
        dto.setAvatar(user != null ? user.getAvatar() : null);
        dto.setScore(record.getScore());
        dto.setTotalTime(record.getTotalTime());
        dto.setCorrectCount(record.getCorrectCount());
        dto.setTotalCount(record.getTotalCount());
        dto.setMode(record.getMode());
        dto.setCreateTime(record.getCreateTime());
        return dto;
    }
}
