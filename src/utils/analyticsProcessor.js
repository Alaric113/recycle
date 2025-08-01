// --- File: src/utils/analyticsProcessor.js ---

/**
 * 處理題目分析數據
 */
export const processQuestionAnalytics = (answers) => {
    const questionStats = {};
    console.log(answers);
    answers.forEach(answer => {
      if (!questionStats[answer.questionId]) {
        questionStats[answer.questionId] = {
          questionId: answer.questionId,
          question: answer.question,
          questionType: answer.questionType,
          correctAnswer: answer.correctAnswer,
          totalAnswers: 0,
          correctAnswers: 0,
          wrongAnswers: {},
          responseTimes: [],
          participants: new Set()
        };
      }
  
      const stat = questionStats[answer.questionId];
      stat.totalAnswers++;
      stat.responseTimes.push(answer.responseTime);
      stat.participants.add(answer.userId);
  
      if (answer.isCorrect) {
        stat.correctAnswers++;
      } else {
        if (!stat.wrongAnswers[answer.userAnswer]) {
          stat.wrongAnswers[answer.userAnswer] = 0;
        }
        stat.wrongAnswers[answer.userAnswer]++;
      }
    });
  
    // 計算統計數據
    return Object.values(questionStats).map(stat => ({
      ...stat,
      correctRate: stat.totalAnswers > 0 ? (stat.correctAnswers / stat.totalAnswers * 100).toFixed(1) : 0,
      averageResponseTime: stat.responseTimes.length > 0 
        ? (stat.responseTimes.reduce((sum, t) => sum + t, 0) / stat.responseTimes.length / 1000).toFixed(1)
        : 0,
      participantCount: stat.participants.size,
      difficulty: stat.totalAnswers > 0 ? (100 - (stat.correctAnswers / stat.totalAnswers * 100)).toFixed(1) : 0
    })).sort((a, b) => parseFloat(b.difficulty) - parseFloat(a.difficulty));
  };
  
  /**
   * 處理個人答題詳情
   */
  export const processUserDetails = (answers, scores) => {
    const userDetails = {};
  
    // 處理答題記錄
    answers.forEach(answer => {
      if (!userDetails[answer.userId]) {
        userDetails[answer.userId] = {
          userId: answer.userId,
          playerName: answer.playerName,
          gender: answer.gender,
          age: answer.age,
          answers: [],
          totalAnswers: 0,
          correctAnswers: 0,
          totalResponseTime: 0
        };
      }
  
      const user = userDetails[answer.userId];
      user.answers.push(answer);
      user.totalAnswers++;
      user.totalResponseTime += answer.responseTime;
  
      if (answer.isCorrect) {
        user.correctAnswers++;
      }
    });
  
    // 合併分數資訊
    scores.forEach(score => {
      if (userDetails[score.userId]) {
        userDetails[score.userId] = {
          ...userDetails[score.userId],
          finalScore: score.score,
          completedAt: score.timestamp
        };
      }
    });
  
    return Object.values(userDetails).map(user => ({
      ...user,
      correctRate: user.totalAnswers > 0 ? (user.correctAnswers / user.totalAnswers * 100).toFixed(1) : 0,
      averageResponseTime: user.totalAnswers > 0 
        ? (user.totalResponseTime / user.totalAnswers / 1000).toFixed(1) 
        : 0
    }));
  };
  
  /**
   * 性別年齡與成績關聯分析
   */
  export const processGenderAgeAnalysis = (userDetails) => {
    const genderStats = {};
    const ageGroups = {
      '18歲以下': { min: 0, max: 17, users: [], totalScore: 0 },
      '18-25歲': { min: 18, max: 25, users: [], totalScore: 0 },
      '26-35歲': { min: 26, max: 35, users: [], totalScore: 0 },
      '36-45歲': { min: 36, max: 45, users: [], totalScore: 0 },
      '46歲以上': { min: 46, max: 999, users: [], totalScore: 0 }
    };
  
    userDetails.forEach(user => {
      // 性別分析
      if (!genderStats[user.gender]) {
        genderStats[user.gender] = {
          count: 0,
          totalScore: 0,
          totalCorrectRate: 0,
          users: []
        };
      }
      
      const genderStat = genderStats[user.gender];
      genderStat.count++;
      genderStat.totalScore += user.finalScore || 0;
      genderStat.totalCorrectRate += parseFloat(user.correctRate);
      genderStat.users.push(user);
  
      // 年齡分組分析
      const age = parseInt(user.age) || 0;
      for (const [groupName, group] of Object.entries(ageGroups)) {
        if (age >= group.min && age <= group.max) {
          group.users.push(user);
          group.totalScore += user.finalScore || 0;
          break;
        }
      }
    });
  
    // 計算平均值
    Object.keys(genderStats).forEach(gender => {
      const stat = genderStats[gender];
      stat.averageScore = stat.count > 0 ? (stat.totalScore / stat.count).toFixed(1) : 0;
      stat.averageCorrectRate = stat.count > 0 ? (stat.totalCorrectRate / stat.count).toFixed(1) : 0;
    });
  
    Object.keys(ageGroups).forEach(groupName => {
      const group = ageGroups[groupName];
      group.averageScore = group.users.length > 0 ? (group.totalScore / group.users.length).toFixed(1) : 0;
      group.count = group.users.length;
    });
  
    return { genderStats, ageGroups };
  };
  