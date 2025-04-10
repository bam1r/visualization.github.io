import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './FibonacciHeapVisualizer.css';

export const FibonacciHeapVisualizer = () => {
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);
    const [showTheory, setShowTheory] = useState(false);

    const handleGoHome = () => navigate('/');

    const addToHistory = (action) => {
        setHistory([...history, action]);
    };

    return (
        <div className="container">
            <div className="sidebar">
                <button className="home-btn" onClick={handleGoHome}>
                    ← На главную
                </button>

                <h2>Операции</h2>
                <div className="input-group">
                    <input
                        type="number"
                        placeholder="Введите число"
                        disabled
                    />
                    <button disabled>
                        Вставить
                    </button>
                    <button disabled>
                        Случайное
                    </button>
                </div>

                <div className="speed-control">
                    <label>Скорость анимации:</label>
                    <input
                        type="range"
                        min="100"
                        max="900"
                        disabled
                    />
                </div>

                <button
                    className="extract-btn"
                    disabled
                >
                    Извлечь минимум
                </button>

                <h2>История</h2>
                <div className="history-container">
                    <div className="history">
                        {history.slice().reverse().map((item, i) => (
                            <div key={i} className="history-item">{item}</div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="visualization-area">
                <div className="visualization">
                    <h1 className="heap-name">Фибоначчиева куча</h1>
                    <div className="heap-info">
                        <span>Размер: -/-</span>
                        <span>Минимум: -</span>
                        <span>Деревьев: -</span>
                    </div>
                    <div className="development-message">
                        <div className="message-content">
                            <h3>Визуализация в разработке</h3>
                            <p>Мы активно работаем над реализацией визуализации Фибоначчиевой кучи. Следите за обновлениями!</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="theory-section">
                <button
                    className="theory-btn"
                    onClick={() => setShowTheory(true)}
                >
                    ?
                </button>

                {showTheory && (
                    <div className="theory-modal">
                        <div className="theory-content">
                            <h2>Теория: Фибоначчиева куча</h2>
                            <button
                                className="close-btn"
                                onClick={() => setShowTheory(false)}
                            >
                                &times;
                            </button>

                            <div className="theory-text">
                                <p><strong>Фибоначчиева куча</strong> — структура данных, состоящая из набора деревьев, удовлетворяющих свойству кучи. Основные особенности:</p>

                                <ul>
                                    <li>Более эффективные амортизированные временные оценки, чем у бинарной кучи</li>
                                    <li>Поддерживает операции вставки и объединения за O(1)</li>
                                    <li>Удаление минимума и уменьшение ключа работают за O(log n)</li>
                                </ul>

                                <p><strong>Основные операции:</strong></p>
                                <ul>
                                    <li>Вставка: O(1)</li>
                                    <li>Поиск минимума: O(1)</li>
                                    <li>Удаление минимума: O(log n) амортизированное</li>
                                    <li>Уменьшение ключа: O(1) амортизированное</li>
                                    <li>Объединение куч: O(1)</li>
                                </ul>

                                <p><strong>Применение:</strong></p>
                                <ul>
                                    <li>Алгоритм Дейкстры для поиска кратчайших путей</li>
                                    <li>Алгоритм Прима для минимального остовного дерева</li>
                                    <li>Задачи, требующие частого уменьшения ключей</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};