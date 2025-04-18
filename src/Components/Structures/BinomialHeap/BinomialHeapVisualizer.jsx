import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './BinomialHeapVisualizer.css';

export const BinomialHeapVisualizer = () => {
    const navigate = useNavigate();
    const canvasRef = useRef(null);
    const [heap, setHeap] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [activeNodes, setActiveNodes] = useState([]);
    const [swappingNodes, setSwappingNodes] = useState([]);
    const [history, setHistory] = useState([]);
    const [animationSpeed, setAnimationSpeed] = useState(500);
    const [isOperating, setIsOperating] = useState(false);
    const MAX_NODES = 15;
    const [showTheory, setShowTheory] = useState(false);

    class BinomialTreeNode {
        constructor(value) {
            this.value = value;
            this.children = [];
            this.degree = 0;
        }
    }

    const mergeTrees = (tree1, tree2) => {
        if (tree1.value > tree2.value) {
            return mergeTrees(tree2, tree1);
        }
        tree1.children.push(tree2);
        tree1.degree++;
        return tree1;
    };

    const unionHeaps = (heap1, heap2) => {
        const newHeap = [];
        let i = 0, j = 0;

        while (i < heap1.length && j < heap2.length) {
            if (heap1[i].degree < heap2[j].degree) {
                newHeap.push(heap1[i++]);
            } else {
                newHeap.push(heap2[j++]);
            }
        }

        while (i < heap1.length) newHeap.push(heap1[i++]);
        while (j < heap2.length) newHeap.push(heap2[j++]);

        for (let k = 0; k < newHeap.length - 1; k++) {
            if (newHeap[k].degree === newHeap[k + 1].degree) {
                const merged = mergeTrees(newHeap[k], newHeap[k + 1]);
                newHeap.splice(k, 2, merged);
                k = -1;
            }
        }

        return newHeap;
    };

    const insert = async (value) => {
        if (!value || isOperating || getNodeCount() >= MAX_NODES) return;

        setIsOperating(true);
        const numValue = parseInt(value);
        if (isNaN(numValue)) return;

        const newNode = new BinomialTreeNode(numValue);
        const newHeap = unionHeaps(heap, [newNode]);
        setHeap(newHeap);
        setHistory([...history, `Добавлено: ${numValue}`]);

        setActiveNodes([`${newHeap.length-1}-0`]);
        await new Promise(resolve => setTimeout(resolve, animationSpeed));
        setActiveNodes([]);

        setIsOperating(false);
        setInputValue('');
    };

    const findMinTree = () => {
        if (heap.length === 0) return null;

        let minTree = heap[0];
        let minIndex = 0;

        for (let i = 1; i < heap.length; i++) {
            if (heap[i].value < minTree.value) {
                minTree = heap[i];
                minIndex = i;
            }
        }

        return { tree: minTree, index: minIndex };
    };

    const extractMin = async () => {
        if (heap.length === 0 || isOperating) return;

        setIsOperating(true);

        const { tree: minTree, index: minIndex } = findMinTree();

        setActiveNodes([`${minIndex}-0`]);
        await new Promise(resolve => setTimeout(resolve, animationSpeed));

        const remainingHeap = [...heap];
        remainingHeap.splice(minIndex, 1);

        const children = [...minTree.children].reverse();

        let resultHeap = [...remainingHeap];

        for (const child of children) {
            resultHeap = unionHeaps(resultHeap, [child]);
        }

        const degrees = new Set();
        for (const tree of resultHeap) {
            if (degrees.has(tree.degree)) {
                console.error("Нарушение свойства биномиальной кучи!");
                return;
            }
            degrees.add(tree.degree);
        }

        setHeap(resultHeap);
        setHistory([...history, `Извлечено: ${minTree.value}`]);
        setActiveNodes([]);
        setIsOperating(false);
    };

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
            ctx.fillStyle = '#FFFFFF';
            ctx.strokeStyle = '#4682B4';
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

        const drawTree = (tree, startX, startY, level = 0, treeIndex = '', parentPos = null) => {
            if (!tree) return;

            const nodeId = `${treeIndex}`;
            const isActive = activeNodes.includes(nodeId);
            const isSwapping = swappingNodes.includes(nodeId);

            drawNode(tree.value, startX, startY, isActive, isSwapping);

            if (parentPos) {
                drawEdge(parentPos.x, parentPos.y, startX, startY,
                    activeNodes.includes(nodeId) && activeNodes.includes(treeIndex.substring(0, treeIndex.lastIndexOf('-'))));
            }

            const childCount = tree.children.length;
            const spacing = Math.min(150, 400 / (level + 1));

            tree.children.forEach((child, i) => {
                const childX = startX + (i - (childCount - 1) / 2) * spacing;
                const childY = startY + 80;
                drawTree(child, childX, childY, level + 1, `${treeIndex}-${i}`, { x: startX, y: startY });
            });
        };

        const drawHeap = () => {
            if (heap.length === 0) {
                ctx.font = '20px Arial';
                ctx.fillStyle = '#888';
                ctx.fillText('Куча пуста', canvas.width / 2, canvas.height / 2);
                return;
            }

            const treeSpacing = 100;
            let startX = 100;

            heap.forEach((tree, treeIndex) => {
                const treeWidth = Math.pow(2, tree.degree) * 30;
                drawTree(tree, startX + treeWidth / 2, 50, 0, `${treeIndex}`);
                startX += treeWidth + treeSpacing;
            });
        };

        drawHeap();
    }, [heap, activeNodes, swappingNodes]);

    const handleGoHome = () => navigate('/');
    const handleSpeedChange = (e) => setAnimationSpeed(1000 - e.target.value);

    const getMinValue = () => {
        if (heap.length === 0) return '-';
        const { tree } = findMinTree();
        return tree.value;
    };

    const getNodeCount = () => {
        return heap.reduce((count, tree) => count + Math.pow(2, tree.degree), 0);
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
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Введите число"
                        disabled={isOperating}
                    />
                    <button
                        onClick={() => insert(inputValue)}
                        disabled={!inputValue || isOperating || getNodeCount() >= MAX_NODES}
                    >
                        Вставить
                    </button>
                    <button
                        onClick={() => insert(Math.floor(Math.random() * 100))}
                        disabled={isOperating || getNodeCount() >= MAX_NODES}
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
                    <h1 className="heap-name">Биномиальная куча</h1>
                    <div className="heap-info">
                        <span>Узлов: {getNodeCount()}/{MAX_NODES}</span>
                        <span>Минимум: {getMinValue()}</span>
                        <span>Деревьев: {heap.length}</span>
                    </div>
                    <div className="canvas-container">
                        <canvas
                            ref={canvasRef}
                            width={1200}
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
                            <button
                                className="close-btn"
                                onClick={() => setShowTheory(false)}
                            >
                                &times;
                            </button>

                            <div className="theory-text">
                                <p><strong>Биномиальная куча</strong> — структура данных, состоящая из набора биномиальных деревьев со следующими свойствами:</p>

                                <ul>
                                    <li>Каждое биномиальное дерево обладает свойством неубывающей кучи</li>
                                    <li>Для любого неотрицательного k в куче существует не более одного дерева порядка k</li>
                                    <li>Все деревья в куче имеют разные порядки</li>
                                </ul>

                                <p><strong>Основные операции:</strong></p>
                                <ul>
                                    <li>Вставка: O(log n)</li>
                                    <li>Извлечение минимума: O(log n)</li>
                                    <li>Слияние куч: O(log n)</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
