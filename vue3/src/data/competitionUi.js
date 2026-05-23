export const competitionActionLabels = {
  openGallery: '查看文物展厅',
  openFilteredGallery: '查看筛选后的文物展厅',
  backExplore: '返回时空探索',
  backGallery: '返回文物展厅',
  backArtifact3d: '返回 3D 文物',
  enter3d: '进入 3D 展示',
  enterAi: '进入 AI 解说',
  focusAi: '解说当前文物',
  resetFilters: '重置筛选条件',
  reloadModel: '重新加载模型',
  send: '发送'
}

export function getModelStatusLabel(isReady) {
  return isReady ? '模型已就绪' : '模型待补充'
}

export function getEnter3dLabel(isReady) {
  return isReady ? competitionActionLabels.enter3d : getModelStatusLabel(false)
}
