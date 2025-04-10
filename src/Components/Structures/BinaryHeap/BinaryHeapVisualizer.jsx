import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './BinaryHeapVisualizer.css';

export const BinaryHeapVisualizer = () => {
    const navigate = useNavigate();
    const canvasRef = useRef(null);
    const [heap, setHeap] = useState([3, 9, 8, 12, 15]);
    const [inputValue, setInputValue] = useState('');
    const [activeNodes, setActiveNodes] = useState([]);
    const [swappingNodes, setSwappingNodes] = useState([]);
    const [history, setHistory] = useState([]);
    const [animationSpeed, setAnimationSpeed] = useState(500);
    const [isOperating, setIsOperating] = useState(false);
    const [showTheory, setShowTheory] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const drawNode = (value, x, y, isActive, isSwapping) => {
            ctx.beginPath();
            ctx.arc(x, y, 20, 0, Math.PI * 2);
            ctx.fillStyle = isSwapping ? '#FFA500' : isActive ? '#FFD700' : '#FFFFFF';
            ctx.strokeStyle = isSwapping ? '#FF4500' : isActive ? '#FF6347' : '#4682B4';
            ctx.lineWidth = 2;
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#000';
            ctx.fillText(value, x, y);
        };

        const drawEdge = (x1, y1, x2, y2, isActive) => {
            ctx.beginPath();
            ctx.moveTo(x1, y1 + 20);
            ctx.lineTo(x2, y2 - 20);
            ctx.strokeStyle = isActive ? '#FF6347' : '#708090';
            ctx.lineWidth = isActive ? 3 : 1;
            ctx.stroke();
        };

        const drawHeap = (nodes, index = 0, x, y, level = 0) => {
            if (index >= nodes.length) return;

            const leftIndex = 2 * index + 1;
            const rightIndex = 2 * index + 2;
            const offset = 200 / (level + 1);

            if (leftIndex < nodes.length) {
                drawEdge(x, y, x - offset, y + 80, activeNodes.includes(index) && activeNodes.includes(leftIndex));
                drawHeap(nodes, leftIndex, x - offset, y + 80, level + 1);
            }

            if (rightIndex < nodes.length) {
                drawEdge(x, y, x + offset, y + 80, activeNodes.includes(index) && activeNodes.includes(rightIndex));
                drawHeap(nodes, rightIndex, x + offset, y + 80, level + 1);
            }

            const isActive = activeNodes.includes(index);
            const isSwapping = swappingNodes.includes(index);
            drawNode(nodes[index], x, y, isActive, isSwapping);
        };

        if (heap.length > 0) {
            drawHeap(heap, 0, canvas.width / 2, 50);
        }
    }, [heap, activeNodes, swappingNodes]);

    const animateSwap = async (index1, index2) => {
        setActiveNodes([index1, index2]);
        setSwappingNodes([index1, index2]);
        await new Promise(resolve => setTimeout(resolve, animationSpeed));
        setSwappingNodes([]);
        setActiveNodes([]);
    };

    // Добавление элемента
    const insert = async (value) => {
        if (!value || heap.length >= 15 || isOperating) return;

        setIsOperating(true);
        const numValue = parseInt(value);
        if (isNaN(numValue)) return;

        const newHeap = [...heap, numValue];
        setHeap(newHeap);
        setHistory([...history, `Добавлено: ${numValue}`]);

        let index = newHeap.length - 1;
        while (index > 0) {
            const parentIndex = Math.floor((index - 1) / 2);
            if (newHeap[parentIndex] <= newHeap[index]) break;

            await animateSwap(index, parentIndex);
            [newHeap[index], newHeap[parentIndex]] = [newHeap[parentIndex], newHeap[index]];
            setHeap([...newHeap]);
            index = parentIndex;
        }

        setIsOperating(false);
        setInputValue('');
    };

    const extractMin = async () => {
        if (heap.length === 0 || isOperating) return;

        setIsOperating(true);
        const min = heap[0];
        let newHeap = [...heap];

        if (newHeap.length === 1) {
            setHeap([]);
        } else {
            const last = newHeap.pop();
            newHeap[0] = last;
            setHeap(newHeap);

            // Просеивание вниз
            let index = 0;
            while (true) {
                const left = 2 * index + 1;
                const right = 2 * index + 2;
                let smallest = index;

                if (left < newHeap.length && newHeap[left] < newHeap[smallest]) {
                    smallest = left;
                }

                if (right < newHeap.length && newHeap[right] < newHeap[smallest]) {
                    smallest = right;
                }

                if (smallest !== index) {
                    await animateSwap(index, smallest);
                    [newHeap[index], newHeap[smallest]] = [newHeap[smallest], newHeap[index]];
                    setHeap([...newHeap]);
                    index = smallest;
                } else {
                    break;
                }
            }
        }

        setHistory([...history, `Извлечено: ${min}`]);
        setIsOperating(false);
    };

    const handleGoHome = () => navigate('/');
    const handleSpeedChange = (e) => setAnimationSpeed(1000 - e.target.value);

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
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Введите число"
                        disabled={isOperating}
                    />
                    <button
                        onClick={() => insert(inputValue)}
                        disabled={!inputValue || heap.length >= 15 || isOperating}
                    >
                        Вставить
                    </button>
                    <button
                        onClick={() => insert(Math.floor(Math.random() * 100))}
                        disabled={heap.length >= 15 || isOperating}
                    >
                        Случайное
                    </button>
                </div>

                <div className="speed-control">
                    <label>Скорость анимации:</label>
                    <input
                        type="range"
                        min="100"
                        max="900"
                        value={1000 - animationSpeed}
                        onChange={handleSpeedChange}
                    />
                </div>

                <button
                    className="extract-btn"
                    onClick={extractMin}
                    disabled={heap.length === 0 || isOperating}
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
                    <h1 className="heap-name">Бинарная куча</h1>
                    <div className="heap-info">
                        <span>Размер: {heap.length}/15</span>
                        <span>Минимум: {heap.length > 0 ? heap[0] : '-'}</span>
                        <span>Уровней: {Math.ceil(Math.log2(heap.length + 1))}</span>
                    </div>
                    <div className="canvas-container">
                        <canvas
                            ref={canvasRef}
                            width={900}
                            height={600}
                            className="heap-canvas"
                        />
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
                            <h2>Теория: Бинарная куча</h2>
                            <button
                                className="close-btn"
                                onClick={() => setShowTheory(false)}
                            >
                                &times;
                            </button>

                            <div className="theory-text">
                                <p><strong>Бинарная куча</strong> — структура данных, обладающая следующими свойствами:</p>

                                <ul>
                                    <li>Свойство кучи: родитель всегда меньше/больше потомков (min-heap/max-heap)</li>
                                    <li>Высота дерева: O(log n), где n — количество элементов</li>
                                </ul>

                                <p><strong>Основные операции:</strong></p>
                                <ul>
                                    <li>Вставка: O(log n)</li>
                                    <li>Извлечение корня: O(log n)</li>
                                    <li>Построение кучи: O(n)</li>
                                    <li>Поиск минимума/максимума: O(1)</li>
                                </ul>

                                <p><strong>Применение:</strong></p>
                                <ul>
                                    <li>Очереди с приоритетом</li>
                                    <li>Алгоритм сортировки Heapsort</li>
                                    <li>Алгоритм Дейкстры</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};