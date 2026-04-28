class ScoreManager {
  static STORAGE_KEY = 'tankBattle_scores';

  static getScores() {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || [];
    } catch { return []; }
  }

  static saveScore(score, level) {
    const scores = this.getScores();
    scores.push({ score, level, date: new Date().toLocaleDateString('zh-TW') });
    scores.sort((a, b) => b.score - a.score);
    scores.splice(10); // keep top 10
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(scores));
  }

  static clearScores() {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
