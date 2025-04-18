import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './FibonacciHeapVisualizer.css';

export const FibonacciHeapVisualizer = () => {
    const navigate = useNavigate();
    const canvasRef = useRef(null);
    const [heap, setHeap] = useState({ min: null, trees: [], size: 0 });
    const [inputValue, setInputValue] = useState('');
    const [activeNodes, setActiveNodes] = useState([]);
    const [swappingNodes, setSwappingNodes] = useState([]);
    const [history, setHistory] = useState([]);
    const [animationSpeed, setAnimationSpeed] = useState(500);
    const [isOperating, setIsOperating] = useState(false);
    const MAX_NODES = 15;
    const [showTheory, setShowTheory] = useState(false);
    const BASE_NODE_WIDTH = 100;
    const NODE_HEIGHT = 50;
    const LEVEL_HEIGHT = 120;
    const HORIZONTAL_SPACING = 60;

    class FibonacciNode {
        constructor(value) {
            this.id = Math.random().toString(36).substr(2, 9);
            this.value = value;
            this.children = [];
            this.parent = null;
            this.marked = false;
            this.degree = 0;
            this.next = this;
            this.prev = this;
        }
    }

    const insert = async (value) => {
        if (!value || isOperating || heap.size >= MAX_NODES) return;

        setIsOperating(true);
        const numValue = parseInt(value);
        if (isNaN(numValue)) return;

        const newNode = new FibonacciNode(numValue);

        const newHeap = {
            min: heap.min === null || numValue < heap.min.value ? newNode : heap.min,
            trees: heap.trees.concat(newNode),
            size: heap.size + 1
        };

        setHeap(newHeap);
        setHistory([...history, `Добавлено: ${numValue}`]);

        setActiveNodes([`new-${newHeap.trees.length-1}`]);
        await new Promise(resolve => setTimeout(resolve, animationSpeed));
        setActiveNodes([]);

        setIsOperating(false);
        setInputValue('');
    };

    const extractMin = async () => {
        if (heap.size === 0 || isOperating) return;

        setIsOperating(true);
        let minNode = heap.min;

        setActiveNodes([`min-${heap.trees.indexOf(minNode)}`]);
        await new Promise(resolve => setTimeout(resolve, animationSpeed));

        let newTrees = heap.trees.filter(tree => tree !== minNode);

        let children = minNode.children.map(child => ({
            ...child,
            parent: null,
            marked: false,
            next: child,
            prev: child
        }));

        setActiveNodes(children.map((_, i) => `child-${i}`));
        await new Promise(resolve => setTimeout(resolve, animationSpeed));

        let tempHeap = {
            min: newTrees[0] || children[0] || null, // временный минимум
            trees: [...newTrees, ...children],
            size: heap.size - 1
        };

        let consolidatedHeap = await consolidate({...tempHeap});

        setHeap(consolidatedHeap);
        setHistory([...history, `Извлечено: ${minNode.value}`]);
        setActiveNodes([]);
        setIsOperating(false);
    };

    const consolidate = async (inputHeap) => {
        if (inputHeap.trees.length <= 1) return inputHeap;

        let trees = [...inputHeap.trees];
        const degreeMap = {};
        let newMin = trees[0] || null;

        for (let i = 0; i < trees.length; i++) {
            let current = {...trees[i]}; // создаем копию узла
            let degree = current.degree;

            setActiveNodes([`consolidate-${i}`]);
            await new Promise(resolve => setTimeout(resolve, animationSpeed/2));

            while (degreeMap[degree]) {
                let other = degreeMap[degree];

                setSwappingNodes([`consolidate-${i}`, `consolidate-other-${degree}`]);
                await new Promise(resolve => setTimeout(resolve, animationSpeed));

                if (current.value > other.value) {
                    [current, other] = [other, current];
                }

                let updatedCurrent = {
                    ...current,
                    children: [
                        ...current.children,
                        {
                            ...other,
                            parent: current,
                            marked: false,
                            next: current.children[0] || other,
                            prev: current.children[0]?.prev || other
                        }
                    ],
                    degree: current.degree + 1
                };

                if (current.children.length > 0) {
                    let firstChild = current.children[0];
                    firstChild.prev.next = other;
                    other.prev = firstChild.prev;
                    other.next = firstChild;
                    firstChild.prev = other;
                }

                current = updatedCurrent;
                delete degreeMap[degree];
                degree++;

                setActiveNodes([`consolidate-result-${degree}`]);
                await new Promise(resolve => setTimeout(resolve, animationSpeed));
            }

            degreeMap[degree] = current;

            if (!newMin || current.value < newMin.value) {
                newMin = current;
            }
        }

        return {
            min: newMin,
            trees: Object.values(degreeMap),
            size: inputHeap.size
        };
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const drawNode = (value, x, y, isActive, isSwapping, isMarked, isMin) => {
            ctx.beginPath();
            ctx.arc(x, y, 20, 0, Math.PI * 2);

            if (isMin) {
                ctx.fillStyle = '#FFD700';
            } else if (isMarked) {
                ctx.fillStyle = '#FF6347';
            } else if (isActive) {
                ctx.fillStyle = '#90EE90';
            } else if (isSwapping) {
                ctx.fillStyle = '#ADD8E6';
            } else {
                ctx.fillStyle = '#FFFFFF';
            }

            ctx.strokeStyle = '#4682B4';
            ctx.lineWidth = 2;
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#000';
            ctx.fillText(value, x, y);
        };

        const drawEdge = (x1, y1, x2, y2, isActive, isParentLink) => {
            ctx.beginPath();
            ctx.moveTo(x1, y1 + 20);
            ctx.lineTo(x2, y2 - 20);

            if (isParentLink) {
                ctx.strokeStyle = isActive ? '#800080' : '#9370DB'; // Фиолетовый для родительских связей
                ctx.setLineDash([5, 3]);
            } else {
                ctx.strokeStyle = isActive ? '#FF6347' : '#708090';
                ctx.setLineDash([]);
            }

            ctx.lineWidth = isActive ? 3 : 1;
            ctx.stroke();
            ctx.setLineDash([]);
        };

        const drawTree = (tree, startX, startY, level = 0, treeIndex = '', parentPos = null, isMinTree = false) => {
            if (!tree) return;

            const nodeId = `${treeIndex}`;
            const isActive = activeNodes.includes(nodeId);
            const isSwapping = swappingNodes.includes(nodeId);
            const isMin = isMinTree && level === 0;

            drawNode(tree.value, startX, startY, isActive, isSwapping, tree.marked, isMin);

            if (parentPos) {
                drawEdge(parentPos.x, parentPos.y, startX, startY,
                    activeNodes.includes(nodeId) && activeNodes.includes(treeIndex.substring(0, treeIndex.lastIndexOf('-'))),
                    true);
            }

            if (tree.children.length > 0) {
                const childCount = tree.children.length;
                const spacing = Math.min(150, 400 / (level + 1));
                let currentChild = tree.children[0];
                let drawnChildren = new Set();
                let i = 0;

                do {
                    if (drawnChildren.has(currentChild)) break;
                    drawnChildren.add(currentChild);

                    const childX = startX + (i - (childCount - 1) / 2) * spacing;
                    const childY = startY + 80;

                    drawTree(currentChild, childX, childY, level + 1, `${treeIndex}-${i}`,
                        { x: startX, y: startY }, isMinTree);

                    const nextChild = currentChild.next;
                    if (nextChild !== tree.children[0] && !drawnChildren.has(nextChild)) {
                        const nextIndex = (i + 1) % childCount;
                        const nextChildX = startX + (nextIndex - (childCount - 1) / 2) * spacing;
                        ctx.beginPath();
                        ctx.moveTo(childX + 20, childY - 20);
                        ctx.lineTo(nextChildX - 20, childY - 20);
                        ctx.strokeStyle = '#708090';
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }

                    currentChild = currentChild.next;
                    i++;
                } while (currentChild !== tree.children[0] && i < childCount);
            }
        };

        const drawHeap = () => {
            if (heap.size === 0) {
                ctx.font = '20px Arial';
                ctx.fillStyle = '#888';
                ctx.fillText('Куча пуста', canvas.width / 2, canvas.height / 2);
                return;
            }

            const treeSpacing = 100;
            let startX = 100;

            heap.trees.forEach((tree, treeIndex) => {
                const treeWidth = Math.pow(2, tree.degree) * 30;
                const isMinTree = heap.min === tree;
                drawTree(tree, startX + treeWidth / 2, 50, 0, `${treeIndex}`, null, isMinTree);

                if (treeIndex < heap.trees.length - 1) {
                    const nextTree = heap.trees[treeIndex + 1];
                    const nextTreeWidth = Math.pow(2, nextTree.degree) * 30;
                    ctx.beginPath();
                    ctx.moveTo(startX + treeWidth + 10, 50);
                    ctx.lineTo(startX + treeWidth + treeSpacing - 10 + nextTreeWidth / 2, 50);
                    ctx.strokeStyle = '#708090';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }

                startX += treeWidth + treeSpacing;
            });
        };

        drawHeap();
    }, [heap, activeNodes, swappingNodes]);

    const handleGoHome = () => navigate('/');
    const handleSpeedChange = (e) => setAnimationSpeed(1000 - e.target.value);

    const getMinValue = () => {
        if (heap.size === 0) return '-';
        return heap.min.value;
    };

    const getNodeCount = () => {
        return heap.size;
    };

    return (
        <div className="container">
            <div className="notification-banner">
                <div className="notification-content">
                    <span className="notification-icon">⚠️</span>
                    <span>
                        Визуализация в режиме тестирования. При некоторых операциях возможны временные неточности.
                        Алгоритм продолжает совершенствоваться.
                    </span>
                </div>
            </div>

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
                    disabled={heap.size === 0 || isOperating}
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
                        <span>Узлов: {getNodeCount()}/{MAX_NODES}</span>
                        <span>Минимум: {getMinValue()}</span>
                        <span>Деревьев: {heap.trees.length}</span>
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
                                <p><strong>Фибоначчиева куча</strong> — структура данных, состоящая из набора деревьев, удовлетворяющих свойству кучи. Основные особенности:</p>

                                <ul>
                                    <li>Каждое дерево удовлетворяет свойству min-heap (или max-heap)</li>
                                    <li>Деревья организованы в циклический двусвязный список</li>
                                    <li>Поддерживается указатель на минимальный (или максимальный) элемент</li>
                                    <li>Узлы могут быть помечены (marked), если они потеряли дочерний узел</li>
                                </ul>

                                <p><strong>Основные операции:</strong></p>
                                <ul>
                                    <li>Вставка: O(1) амортизированное</li>
                                    <li>Извлечение минимума: O(log n) амортизированное</li>
                                    <li>Уменьшение ключа: O(1) амортизированное</li>
                                    <li>Слияние куч: O(1) амортизированное</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};