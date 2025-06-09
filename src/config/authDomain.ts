export const getAuthDomain = (): string => {
  // 在生產環境中使用固定的Firebase authDomain
  if (window.location.hostname === 'nicetone.ai') {
    return 'nicetone.ai';
  }
  // 開發環境使用localhost
  return 'localhost';
};
