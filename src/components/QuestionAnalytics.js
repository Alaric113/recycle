// --- File: src/components/QuestionAnalytics.js ---
import React, { useState, useEffect } from 'react';
import { subscribeToAnalytics } from '../hooks/answerAnalytics';
import { processQuestionAnalytics, processUserDetails, processGenderAgeAnalysis } from '../utils/analyticsProcessor';
import { BarChart, PieChart, StatsCard } from './AnalyticsCharts';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';

const QuestionAnalytics = ({ db, eventName, onBack }) => {
  const [answers, setAnswers] = useState([]);
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [ageFilter, setAgeFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // 即時監聽數據更新
  useEffect(() => {
    if (!db || !eventName) return;
    

    const unsubscribe = subscribeToAnalytics(db, eventName, ({ type, data }) => {
      if (type === 'answers') {
        
        setAnswers(data);
      } else if (type === 'scores') {
        setScores(data);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [db, eventName]);

  // 處理分析數據
  const questionAnalytics = processQuestionAnalytics(answers);
  const userDetails = processUserDetails(answers, scores);
  const { genderStats, ageGroups } = processGenderAgeAnalysis(userDetails);

  // 篩選功能
  const filteredUserDetails = userDetails.filter(user => {
    const matchSearch = user.playerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchGender = !genderFilter || user.gender === genderFilter;
    const matchAge = !ageFilter || (
      ageFilter === '18-' ? parseInt(user.age) < 18 :
      ageFilter === '18-25' ? parseInt(user.age) >= 18 && parseInt(user.age) <= 25 :
      ageFilter === '26-35' ? parseInt(user.age) >= 26 && parseInt(user.age) <= 35 :
      ageFilter === '36+' ? parseInt(user.age) >= 36 : true
    );
    
    return matchSearch && matchGender && matchAge;
  });

  // 匯出功能
  const handleExportCSV = (dataType) => {
    switch (dataType) {
      case 'questions':
        exportToCSV(questionAnalytics, `${eventName}_題目分析`, [
          'question', 'correctRate', 'totalAnswers', 'averageResponseTime', 'difficulty'
        ]);
        break;
      case 'users':
        exportToCSV(filteredUserDetails, `${eventName}_使用者分析`, [
          'playerName', 'gender', 'age', 'finalScore', 'correctRate', 'averageResponseTime'
        ]);
        break;
    }
  };
  

  // 總覽統計
  const overviewStats = {
    totalParticipants: userDetails.length,
    totalQuestions: questionAnalytics.length,
    
    // 🔧 修正：這應該是平均分數，不是平均正確率
    averageScore: userDetails.length > 0 ? 
      (userDetails.reduce((sum, u) => sum + (u.score || 0), 0) / userDetails.length).toFixed(1) : 0,
      
    // 🔧 新增：真正的平均正確率
    averageCorrectRate: userDetails.length > 0 ? 
      (userDetails.reduce((sum, u) => sum + (parseFloat(u.correctRate) || 0), 0) / userDetails.length).toFixed(1) : 0,
      
    overallCorrectRate: answers.length > 0 ? 
      (answers.filter(a => a.isCorrect).length / answers.length * 100).toFixed(1) : 0
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">載入分析數據中...</div>
      </div>
    );
  }

  return (
    <div className="h-full min-h-screen bg-gray-50 p-4 sm:p-6 flex flex-col" id="analytics-content">
      <div className="flex-1 max-w-7xl mx-auto bg-white rounded-lg shadow-lg w-full flex flex-col overflow-hidden">
        
        {/* 頂部導航 */}
        <div className="flex-shrink-0 p-4 sm:p-6 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-800">答題分析 - {eventName}</h1>
            <div className="flex space-x-2">
              <button
                onClick={() => exportToPDF('analytics-content', `${eventName}_分析報告`)}
                className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
              >
                匯出PDF
              </button>
              <button
                onClick={onBack}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                返回
              </button>
            </div>
          </div>

          {/* 分頁標籤 */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-4">
            {[
              { id: 'overview', label: '總覽' },
              { id: 'questions', label: '題目分析' },
              { id: 'users', label: '個人詳情' },
              { id: 'demographics', label: '性別年齡分析' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 篩選器 */}
          {activeTab === 'users' && (
            <div className="flex flex-wrap gap-4">
              <input
                type="text"
                placeholder="搜尋姓名..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">所有性別</option>
                <option value="male">男性</option>
                <option value="female">女性</option>
                <option value="other">其他</option>
              </select>
              <select
                value={ageFilter}
                onChange={(e) => setAgeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">所有年齡</option>
                <option value="18-">18歲以下</option>
                <option value="18-25">18-25歲</option>
                <option value="26-35">26-35歲</option>
                <option value="36+">36歲以上</option>
              </select>
            </div>
          )}
        </div>

        {/* 內容區域 */}
        <div className="flex-1 p-4 sm:p-6 overflow-auto">
          
          {/* 總覽頁面 */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* 統計卡片 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard 
                  title="總參與人數" 
                  value={overviewStats.totalParticipants} 
                  color="blue" 
                />
                <StatsCard 
                  title="題目總數" 
                  value={overviewStats.totalQuestions} 
                  color="green" 
                />
                <StatsCard 
                  title="平均分數" 
                  value={`${overviewStats.averageScore}分`} 
                  color="yellow" 
                />
                <StatsCard 
                  title="整體正確率" 
                  value={`${overviewStats.overallCorrectRate}%`} 
                  color="purple" 
                />
              </div>

              {/* 圖表區域 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <BarChart
                  data={questionAnalytics.slice(0, 5)}
                  title="題目難度排行 (Top 5)"
                  xKey="question"
                  yKey="difficulty"
                  color="bg-red-500"
                />
                <PieChart
                  data={Object.entries(genderStats).map(([gender, stat]) => ({
                    label: gender === 'male' ? '男性' : gender === 'female' ? '女性' : '其他',
                    value: stat.count
                  }))}
                  title="參與者性別分布"
                />
              </div>
            </div>
          )}

          {/* 題目分析頁面 */}
          {activeTab === 'questions' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">題目分析詳情</h2>
                <button
                  onClick={() => handleExportCSV('questions')}
                  className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                >
                  匯出CSV
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <BarChart
                  data={questionAnalytics}
                  title="各題正確率"
                  xKey="question"
                  yKey="correctRate"
                  color="bg-green-500"
                />
                <BarChart
                  data={questionAnalytics.sort((a, b) => parseFloat(a.averageResponseTime) - parseFloat(b.averageResponseTime))}
                  title="各題平均回應時間"
                  xKey="question"
                  yKey="averageResponseTime"
                  color="bg-yellow-500"
                />
              </div>

              {/* 題目詳情表格 */}
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">題目</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">正確答案</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">正確率</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">答題人次</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">平均時間</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">常見錯誤</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {questionAnalytics.map((question, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{question.question}</td>
                        <td className="px-4 py-3 text-sm font-medium text-green-600">
                          {question.correctAnswer}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded text-xs ${
                            parseFloat(question.correctRate) >= 80 ? 'bg-green-100 text-green-800' :
                            parseFloat(question.correctRate) >= 60 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {question.correctRate}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">{question.totalAnswers}</td>
                        <td className="px-4 py-3 text-sm">{question.averageResponseTime}秒</td>
                        <td className="px-4 py-3 text-sm">
                          {Object.entries(question.wrongAnswers).slice(0, 2).map(([answer, count]) => (
                            <span key={answer} className="inline-block bg-red-100 text-red-800 px-2 py-1 rounded text-xs mr-1 mb-1">
                              {answer} ({count})
                            </span>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 個人詳情頁面 */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">個人答題詳情</h2>
                <button
                  onClick={() => handleExportCSV('users')}
                  className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                >
                  匯出CSV
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">姓名</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">性別</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">年齡</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">總分</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">正確率</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">平均時間</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">答題記錄</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredUserDetails.map((user, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium">{user.playerName}</td>
                        <td className="px-4 py-3 text-sm">
                          {user.gender === 'male' ? '男' : user.gender === 'female' ? '女' : '其他'}
                        </td>
                        <td className="px-4 py-3 text-sm">{user.age}歲</td>
                        <td className="px-4 py-3 text-sm font-bold text-blue-600">
                          {user.finalScore || 0}分
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded text-xs ${
                            parseFloat(user.correctRate) >= 80 ? 'bg-green-100 text-green-800' :
                            parseFloat(user.correctRate) >= 60 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {user.correctRate}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">{user.averageResponseTime}秒</td>
                        <td className="px-4 py-3 text-sm">
                          <details className="cursor-pointer">
                            <summary className="text-blue-500 hover:text-blue-700">
                              查看詳情 ({user.answers.length}題)
                            </summary>
                            <div className="mt-2 p-2 bg-gray-50 rounded text-xs max-h-32 overflow-y-auto">
                              {user.answers.map((answer, i) => (
                                <div key={i} className={`mb-1 ${answer.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                                  Q{i+1}: {answer.isCorrect ? '✓' : '✗'} {answer.userAnswer}
                                  {!answer.isCorrect && ` (正確: ${answer.correctAnswer})`}
                                </div>
                              ))}
                            </div>
                          </details>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 性別年齡分析頁面 */}
          {activeTab === 'demographics' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">性別與年齡分析</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 性別分析 */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4">性別表現分析</h3>
                  <div className="space-y-4">
                    {Object.entries(genderStats).map(([gender, stat]) => (
                      <div key={gender} className="border-b pb-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">
                            {gender === 'male' ? '男性' : gender === 'female' ? '女性' : '其他'}
                          </span>
                          <span className="text-sm text-gray-600">{stat.count}人</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">平均分數:</span>
                            <span className="font-medium ml-2">{stat.averageScore}分</span>
                          </div>
                          <div>
                            <span className="text-gray-600">平均正確率:</span>
                            <span className="font-medium ml-2">{stat.averageCorrectRate}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 年齡分組分析 */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4">年齡組表現分析</h3>
                  <div className="space-y-4">
                    {Object.entries(ageGroups).map(([groupName, group]) => (
                      <div key={groupName} className="border-b pb-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{groupName}</span>
                          <span className="text-sm text-gray-600">{group.count}人</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-600">平均分數:</span>
                          <span className="font-medium ml-2">{group.averageScore}分</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 圖表顯示 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <BarChart
                  data={Object.entries(genderStats).map(([gender, stat]) => ({
                    gender: gender === 'male' ? '男性' : gender === 'female' ? '女性' : '其他',
                    averageScore: stat.averageScore
                  }))}
                  title="各性別平均分數"
                  xKey="gender"
                  yKey="averageScore"
                  color="bg-purple-500"
                />
                <BarChart
                  data={Object.entries(ageGroups).map(([groupName, group]) => ({
                    ageGroup: groupName,
                    averageScore: group.averageScore
                  }))}
                  title="各年齡組平均分數"
                  xKey="ageGroup"
                  yKey="averageScore"
                  color="bg-indigo-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionAnalytics;
