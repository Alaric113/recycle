import React, { useState, useEffect, useCallback } from 'react';
import trashCar from '../img/trashcar.png';

export const ProgressLine = ({ current, total, stationNames = [],progressStat }) => {
    const [progress, setProgress] = useState(0);
    const [isMoving, setIsMoving] = useState(false);
    
    useEffect(() => {
        setIsMoving(true);
        setTimeout(() => setIsMoving(false), 700);
        
        // 計算進度百分比
        const progressPercent = current > 0 ? ((current - 1) / (total - 1)) * 100 : 0;
        setProgress(progressPercent);
    }, [current, total]);
    
    // 生成站牌資料
    const generateStations = () => {
        const stations = [];
        for (let i = 0; i < total; i++) {
            const position = total > 1 ? (i / (total - 1)) * 100 : 0;
            stations.push({
                id: i + 1,
                position: position,
                isCorrect: progressStat[i]||false,
                isActive: i + 1 <= current,
                isCurrent: i + 1 === current,
                isCompleted: i + 1 < current,
                name: stationNames[i] || `第${i + 1}題`
            });
        }
        console.log(stations)
        return stations;
    };
    
    const stations = generateStations();
    
    return (
        <div className="w-full pb-12 px-4 select-none">
            <div className="relative">
                {/* 主要進度條軌道 */}
                <div className="w-full bg-gray-200/50 rounded-full h-3 shadow-inner">
                    <div
                        className="bg-gradient-to-r from-blue-500/60 to-blue-600 h-3 rounded-full transition-all duration-700 ease-in-out shadow-sm"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                
                {/* 站牌系統 */}
                {stations.map((station) => (
                    <div
                        key={station.id}
                        className="absolute transform -translate-x-1/2"
                        style={{ 
                            left: `${station.position}%`,
                            top: '-12px'
                        }}
                    >
                        {/* 站牌柱子 */}
                        <div className="flex flex-col items-center">
                            {/* 站牌圓點 */}
                            <div
                                className={`w-8 h-8 rounded-full border-3 transition-all duration-500 flex items-center justify-center shadow-md ${
                                    station.isCompleted
                                        ? station.isCorrect
                                            ?'bg-green-500 border-green-500 text-white'
                                            :'bg-red-500 border-red-500 text-white' 
                                        : station.isCurrent
                                        ? 'bg-blue-600 border-blue-600 text-white ring-4 ring-blue-200'
                                        : station.isActive
                                        ? 'bg-blue-600 border-blue-600 text-white'
                                        : 'bg-white/50 border-gray-300 text-gray-400'
                                }`}
                            >
                                {station.isCompleted ? (
                                    station.isCorrect ? (
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    )
                                ) : (
                                    <span className="text-sm font-bold">{station.id}</span>
                                )}
                            </div>
                            
                            
                        </div>
                    </div>
                ))}
                
                {/* 垃圾車動畫 */}
                <div
                    className={`absolute transform hidden -translate-x-1/2 transition-all duration-700 ease-in-out ${
                        isMoving ? 'scale-110' : 'scale-100'
                    }`}
                    style={{ 
                        left: `${progress}%`,
                        top: '-25px',
                        zIndex: 20
                    }}
                >
                    <div className="relative">
                        <img
                            src={trashCar}
                            alt="垃圾車"
                            className={`w-14 h-10 object-contain drop-shadow-lg transition-transform duration-300 ${
                                isMoving ? 'animate-bounce' : ''
                            }`}
                        />
                        {/* 垃圾車陰影 */}
                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-2 bg-black opacity-20 rounded-full blur-sm" />
                    </div>
                </div>
                
                
                
            </div>
        </div>
    );
};
