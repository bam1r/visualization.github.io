import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './TwoThreeHeapVisualizer.css';

export const TwoThreeHeapVisualizer = () => {
    const navigate = useNavigate();
    const canvasRef = useRef(null);
    const [heap, setHeap] = useState(null);
    const [inputValue, setInputValue] = useState('');
    const [activeNodes, setActiveNodes] = useState([]);
    const [swappingNodes, setSwappingNodes] = useState([]);
    const [history, setHistory] = useState([]);
    const [animationSpeed, setAnimationSpeed] = useState(500);
    const [isOperating, setIsOperating] = useState(false);
    const MAX_NODES = 8;
    const [showTheory, setShowTheory] = useState(false);

    class TwoThreeNode {
        constructor(value, isLeaf = true) {
            this.values = [value];
            this.children = [];
            this.isLeaf = isLeaf;
            this.parent = null;
        }
    }

    const insert = async (value) => {
        if (!value || isOperating || getNodeCount() >= MAX_NODES) return;

        setIsOperating(true);
        const numValue = parseInt(value);
        if (isNaN(numValue)) return;

        setHistory([...history, `Добавлено: ${numValue}`]);

        if (!heap) {
            setHeap(new TwoThreeNode(numValue));
            setIsOperating(false);
            setInputValue('');
            return;
        }

        let node = heap;
        const path = [];
        while (!node.isLeaf) {
            path.push(node);
            if (numValue < node.values[0]) {
                node = node.children[0];
            } else if (node.values.length === 1 || numValue < node.values[1]) {
                node = node.children[1];
            } else {
                node = node.children[2];
            }
        }

        setActiveNodes([getNodePath(node)]);
        await new Promise(resolve => setTimeout(resolve, animationSpeed));

        node.values.push(numValue);
        node.values.sort((a, b) => a - b);

        await splitNode(node, path);

        setActiveNodes([]);
        setIsOperating(false);
        setInputValue('');
    };

    const getNodePath = (node) => {
        if (!node.parent) return 'root';

        let path = '';
        let current = node;
        const segments = [];

        while (current.parent) {
            const index = current.parent.children.indexOf(current);
            segments.unshift(index);
            current = current.parent;
        }

        return 'root-' + segments.join('-');
    };

    const splitNode = async (node, path) => {
        if (node.values.length <= 2) return node;

        const middleValue = node.values[1];
        const leftNode = new TwoThreeNode(node.values[0], node.isLeaf);
        const rightNode = new TwoThreeNode(node.values[2], node.isLeaf);

        if (!node.isLeaf) {
            leftNode.children = [node.children[0], node.children[1]];
            rightNode.children = [node.children[2], node.children[3]];
            leftNode.children.forEach(child => child.parent = leftNode);
            rightNode.children.forEach(child => child.parent = rightNode);
        }

        const parent = path.pop();
        if (!parent) {
            const newRoot = new TwoThreeNode(middleValue, false);
            newRoot.children = [leftNode, rightNode];
            leftNode.parent = newRoot;
            rightNode.parent = newRoot;
            setHeap(newRoot);
            return newRoot;
        }

        parent.values.push(middleValue);
        parent.values.sort((a, b) => a - b);

        const index = parent.children.indexOf(node);
        parent.children.splice(index, 1, leftNode, rightNode);
        leftNode.parent = parent;
        rightNode.parent = parent;

        setActiveNodes([getNodePath(leftNode), getNodePath(rightNode)]);
        await new Promise(resolve => setTimeout(resolve, animationSpeed));

        return splitNode(parent, path);
    };

    const extractMin = async () => {
        if (!heap || isOperating) return;

        setIsOperating(true);
        setHistory([...history, `Извлечено: ${findMinValue()}`]);

        let node = heap;
        const path = [];
        while (!node.isLeaf) {
            path.push(node);
            node = node.children[0];
        }

        setActiveNodes([getNodePath(node)]);
        await new Promise(resolve => setTimeout(resolve, animationSpeed));

        node.values.shift();

        if (node.values.length > 0) {
            setIsOperating(false);
            return;
        }

        await fixEmptyNode(node, path);

        setActiveNodes([]);
        setIsOperating(false);
    };

    const fixEmptyNode = async (node, path) => {
        if (!node.parent) {
            if (node.children.length === 0) {
                setHeap(null);
            } else {
                node.children[0].parent = null;
                setHeap(node.children[0]);
            }
            return;
        }

        const parent = node.parent;
        const nodeIndex = parent.children.indexOf(node);

        if (nodeIndex > 0) {
            const leftSibling = parent.children[nodeIndex - 1];
            if (leftSibling.values.length > 1) {
                const valueFromSibling = leftSibling.values.pop();
                const valueFromParent = parent.values[nodeIndex - 1];
                parent.values[nodeIndex - 1] = valueFromSibling;

                node.values.push(valueFromParent);

                if (!node.isLeaf) {
                    const childFromSibling = leftSibling.children.pop();
                    childFromSibling.parent = node;
                    node.children.unshift(childFromSibling);
                }

                return;
            }
        }

        if (nodeIndex < parent.children.length - 1) {
            const rightSibling = parent.children[nodeIndex + 1];
            if (rightSibling.values.length > 1) {
                const valueFromSibling = rightSibling.values.shift();
                const valueFromParent = parent.values[nodeIndex];
                parent.values[nodeIndex] = valueFromSibling;

                node.values.push(valueFromParent);

                if (!node.isLeaf) {
                    const childFromSibling = rightSibling.children.shift();
                    childFromSibling.parent = node;
                    node.children.push(childFromSibling);
                }

                return;
            }
        }

        if (nodeIndex > 0) {
            const leftSibling = parent.children[nodeIndex - 1];
            const valueFromParent = parent.values.splice(nodeIndex - 1, 1)[0];

            leftSibling.values.push(valueFromParent);
            leftSibling.values.sort((a, b) => a - b);

            node.children.forEach(child => {
                child.parent = leftSibling;
                leftSibling.children.push(child);
            });

            parent.children.splice(nodeIndex, 1);
        } else {
            const rightSibling = parent.children[nodeIndex + 1];
            const valueFromParent = parent.values.splice(nodeIndex, 1)[0];

            rightSibling.values.unshift(valueFromParent);
            rightSibling.values.sort((a, b) => a - b);

            node.children.forEach(child => {
                child.parent = rightSibling;
                rightSibling.children.unshift(child);
            });

            parent.children.splice(nodeIndex, 1);
        }

        if (parent.values.length === 0) {
            await fixEmptyNode(parent, path.slice(0, -1));
        }
    };

    const findMinValue = () => {
        if (!heap) return '-';

        let node = heap;
        while (!node.isLeaf) {
            node = node.children[0];
        }
        return node.values[0];
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const drawNode = (node, x, y, isActive, isSwapping) => {
            const width = node.values.length === 1 ? 60 : 90;
            const height = 40;

            ctx.beginPath();
            ctx.roundRect(x - width/2, y - height/2, width, height, 8);
            ctx.fillStyle = isActive ? '#FFE0B2' : '#FFFFFF';
            ctx.strokeStyle = isActive ? '#FF8F00' : '#4682B4';
            ctx.lineWidth = 2;
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#000';
            if (node.values.length === 1) {
                ctx.fillText(node.values[0], x, y);
            } else {
                ctx.fillText(node.values[0], x - 20, y);
                ctx.fillText(node.values[1], x + 20, y);
            }
        };

        const drawEdge = (x1, y1, x2, y2, isActive) => {
            ctx.beginPath();
            ctx.moveTo(x1, y1 + 20);
            ctx.lineTo(x2, y2 - 20);
            ctx.strokeStyle = isActive ? '#FF6347' : '#708090';
            ctx.lineWidth = isActive ? 3 : 1;
            ctx.stroke();
        };

        const drawTree = (node, startX, startY, level = 0, path = 'root', parentPos = null) => {
            if (!node) return;

            const isActive = activeNodes.includes(path);
            const isSwapping = swappingNodes.includes(path);

            drawNode(node, startX, startY, isActive, isSwapping);

            if (parentPos) {
                drawEdge(parentPos.x, parentPos.y, startX, startY,
                    activeNodes.includes(path) && activeNodes.includes(path.substring(0, path.lastIndexOf('-'))));
            }

            if (node.children.length > 0) {
                const childCount = node.children.length;
                // const spacing = Math.min(1000, 400 / (level + 1));
                let spacing = 0;
                if (level === 0) {
                    spacing = 400;
                } else if (level === 1) {
                    spacing = 200;
                } else if (level === 2) {
                    spacing = 200;
                }

                node.children.forEach((child, i) => {
                    const childX = startX + (i - (childCount - 1) / 2) * spacing;
                    const childY = startY + 80;
                    drawTree(child, childX, childY, level + 1, `${path}-${i}`, { x: startX, y: startY });
                });
            }
        };

        const drawHeap = () => {
            if (!heap) {
                ctx.font = '20px Arial';
                ctx.fillStyle = '#888';
                ctx.fillText('Куча пуста', canvas.width / 2, canvas.height / 2);
                return;
            }

            drawTree(heap, canvas.width / 2, 50);
        };

        drawHeap();
    }, [heap, activeNodes, swappingNodes]);

    const handleGoHome = () => navigate('/');
    const handleSpeedChange = (e) => setAnimationSpeed(1000 - e.target.value);

    const getNodeCount = () => {
        if (!heap) return 0;

        const countNodes = (node) => {
            let count = 1;
            node.children.forEach(child => {
                count += countNodes(child);
            });
            return count;
        };

        return countNodes(heap);
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
                    disabled={!heap || isOperating}
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
                    <h1 className="heap-name">2-3 Куча</h1>
                    <div className="heap-info">
                        <span>Узлов: {getNodeCount()}</span>
                        <span>Минимум: {findMinValue()}</span>
                        <span>Высота: {heap ? calculateHeight(heap) : 0}</span>
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
                                <p><strong>2-3 куча</strong> — это разновидность кучи, где каждый узел может содержать 1 или 2 значения и соответственно иметь 2 или 3 потомка.</p>

                                <ul>
                                    <li>Все листья находятся на одном уровне</li>
                                    <li>Узлы с одним значением имеют 2 потомка, с двумя значениями — 3 потомка</li>
                                    <li>Значения в узле упорядочены</li>
                                    <li>Для любого узла значения в потомках корректно упорядочены относительно значений родителя</li>
                                </ul>

                                <p><strong>Основные операции:</strong></p>
                                <ul>
                                    <li>Вставка: O(log n)</li>
                                    <li>Извлечение минимума: O(log n)</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    function calculateHeight(node) {
        if (!node) return 0;
        let height = 0;
        let current = node;
        while (current) {
            height++;
            current = current.children.length > 0 ? current.children[0] : null;
        }
        return height;
    }
};