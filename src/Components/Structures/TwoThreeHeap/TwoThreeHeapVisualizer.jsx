import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './TwoThreeHeapVisualizer.css';

class TwoThreeNode {
    constructor(keys = [], children = []) {
        this.keys = [...keys].sort((a, b) => a - b);
        this.children = children;
        this.parent = null;
        this.id = crypto.randomUUID();
        this.x = 0;
        this.y = 0;
        this.width = 0;
    }

    get isLeaf() {
        return this.children.length === 0;
    }

    get isFull() {
        return this.keys.length === 2;
    }

    addKey(key) {
        this.keys = [...this.keys, key].sort((a, b) => a - b);
    }

    split() {
        if (this.keys.length < 3) return null;

        const midKey = this.keys[1];
        const left = new TwoThreeNode([this.keys[0]], this.children.slice(0, 2));
        const right = new TwoThreeNode([this.keys[2]], this.children.slice(2));

        left.parent = this;
        right.parent = this;

        return { midKey, left, right };
    }
}

export const TwoThreeHeapVisualizer = () => {
    const navigate = useNavigate();
    const canvasRef = useRef(null);
    const [root, setRoot] = useState(null);
    const [inputValue, setInputValue] = useState('');
    const [history, setHistory] = useState([]);
    const [isOperating, setIsOperating] = useState(false);
    const [showTheory, setShowTheory] = useState(false);
    const MAX_NODES = 10;
    const BASE_NODE_WIDTH = 100;
    const NODE_HEIGHT = 50;
    const LEVEL_HEIGHT = 120;
    const HORIZONTAL_SPACING = 60;

    // Глубокая копия узла
    const deepClone = (node) => {
        if (!node) return null;

        const clone = new TwoThreeNode([...node.keys]);
        clone.children = node.children.map(child => {
            const childClone = deepClone(child);
            if (childClone) childClone.parent = clone;
            return childClone;
        });
        clone.id = node.id;
        clone.x = node.x;
        clone.y = node.y;
        clone.width = node.width;
        return clone;
    };

    // Подсчет количества узлов
    const getNodeCount = (node = root) => {
        if (!node) return 0;
        return 1 + node.children.reduce((sum, child) => sum + getNodeCount(child), 0);
    };

    // Поиск минимального элемента
    const findMin = () => {
        let current = root;
        if (!current) return '-';

        while (current.children.length > 0) {
            current = current.children[0];
        }

        return current.keys[0] ?? '-';
    };

    // Вставка элемента
    const insert = async (value) => {
        if (isOperating || getNodeCount() >= MAX_NODES) return;

        const numValue = Number(value);
        if (isNaN(numValue)) return;

        setIsOperating(true);

        try {
            let newRoot = deepClone(root);
            const path = [];

            // Если куча пуста
            if (!newRoot) {
                newRoot = new TwoThreeNode([numValue]);
            }
            // Если в куче есть элементы
            else {
                let current = newRoot;

                // Находим лист для вставки
                while (!current.isLeaf) {
                    path.push(current);

                    let childIndex = 0;
                    while (childIndex < current.keys.length && numValue > current.keys[childIndex]) {
                        childIndex++;
                    }

                    current = current.children[childIndex];
                }

                // Вставляем ключ в лист
                current.addKey(numValue);
                path.push(current);

                // Обрабатываем возможные переполнения
                for (let i = path.length - 1; i >= 0; i--) {
                    const node = path[i];

                    // Если узел не переполнен
                    if (node.keys.length <= 2) continue;

                    // Разделяем переполненный узел
                    const splitResult = node.split();
                    if (!splitResult) continue;

                    const { midKey, left, right } = splitResult;

                    // Если это корень
                    if (i === 0) {
                        newRoot = new TwoThreeNode([midKey], [left, right]);
                        left.parent = newRoot;
                        right.parent = newRoot;
                    }
                    // Если это не корень
                    else {
                        const parent = path[i - 1];
                        parent.addKey(midKey);

                        const pos = parent.children.indexOf(node);
                        parent.children.splice(pos, 1, left, right);
                        left.parent = parent;
                        right.parent = parent;
                    }
                }
            }

            setRoot(newRoot);
            setHistory(prev => [`Вставлено: ${numValue}`, ...prev.slice(0, 9)]);
        } catch (error) {
            console.error('Ошибка при вставке:', error);
        } finally {
            setIsOperating(false);
            setInputValue('');
        }
    };

    // Удаление минимального элемента
    const extractMin = async () => {
        if (!root || isOperating) return;
        setIsOperating(true);

        try {
            let newRoot = deepClone(root);
            const path = [];
            let current = newRoot;

            // Находим минимальный элемент (крайний левый лист)
            while (current.children.length > 0) {
                path.push(current);
                current = current.children[0];
            }

            // Если лист пуст
            if (current.keys.length === 0) {
                throw new Error('Попытка удаления из пустого листа');
            }

            // Удаляем минимальный ключ
            const minValue = current.keys.shift();
            setHistory(prev => [`Извлечено: ${minValue}`, ...prev.slice(0, 9)]);

            // Восстанавливаем свойства кучи
            for (let i = path.length - 1; i >= 0; i--) {
                const node = path[i];

                // Если у левого ребенка есть ключи - все в порядке
                if (node.children[0].keys.length >= 1) {
                    break;
                }

                // Пытаемся взять ключ у правого соседа
                if (node.children[1]?.keys.length > 1) {
                    node.children[0].keys.push(node.keys[0]);
                    node.keys[0] = node.children[1].keys.shift();
                    break;
                }
                // Если правый сосед есть, но у него только 1 ключ - объединяем
                else if (node.children[1]) {
                    node.children[0].keys.push(node.keys[0]);
                    node.children[0].keys.push(...node.children[1].keys);
                    node.keys.shift();
                    node.children.splice(1, 1);
                }
                // Если нет правого соседа, пытаемся взять у левого
                else if (i > 0) {
                    const parent = path[i - 1];
                    const nodeIndex = parent.children.indexOf(node);

                    if (nodeIndex > 0) {
                        const leftSibling = parent.children[nodeIndex - 1];
                        if (leftSibling.keys.length > 1) {
                            node.children[0].keys.unshift(parent.keys[nodeIndex - 1]);
                            parent.keys[nodeIndex - 1] = leftSibling.keys.pop();
                            break;
                        }
                    }
                }
            }

            // Если корень остался без ключей, но есть дети
            if (newRoot.keys.length === 0 && newRoot.children.length > 0) {
                newRoot = newRoot.children[0];
                newRoot.parent = null;
            }

            setRoot(newRoot);
        } catch (error) {
            console.error('Ошибка при удалении:', error);
        } finally {
            setIsOperating(false);
        }
    };

    // Отрисовка кучи
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Расчет позиций узлов
        const calculateLayout = (node, x, y, level = 0, availableWidth = canvas.width - 100) => {
            if (!node) return;

            // Динамическая ширина узла в зависимости от количества ключей
            node.width = BASE_NODE_WIDTH + (node.keys.length - 1) * 30;
            node.x = x;
            node.y = y;

            if (node.children.length > 0) {
                const childAreaWidth = availableWidth - HORIZONTAL_SPACING * (node.children.length - 1);
                const childWidth = childAreaWidth / node.children.length;
                let currentX = x - availableWidth / 2 + childWidth / 2;

                for (const child of node.children) {
                    calculateLayout(child, currentX, y + LEVEL_HEIGHT, level + 1, childWidth);
                    currentX += childWidth + HORIZONTAL_SPACING;
                }
            }
        };

        // Отрисовка узла
        const drawNode = (node) => {
            // Прямоугольник узла
            ctx.beginPath();
            ctx.roundRect(
                node.x - node.width / 2,
                node.y - NODE_HEIGHT / 2,
                node.width,
                NODE_HEIGHT,
                8
            );
            ctx.fillStyle = '#FFF';
            ctx.strokeStyle = '#2196F3';
            ctx.lineWidth = 2;
            ctx.fill();
            ctx.stroke();

            // Ключи узла
            ctx.fillStyle = '#000';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';

            const keySpacing = node.width / (node.keys.length + 1);
            node.keys.forEach((key, i) => {
                ctx.fillText(
                    key.toString(),
                    node.x - node.width / 2 + keySpacing * (i + 1),
                    node.y + 5
                );
            });
        };

        // Отрисовка соединений между узлами
        const drawConnections = (node) => {
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 1.5;

            node.children.forEach(child => {
                ctx.beginPath();
                ctx.moveTo(node.x, node.y + NODE_HEIGHT / 2);
                ctx.lineTo(child.x, child.y - NODE_HEIGHT / 2);
                ctx.stroke();
                drawConnections(child);
            });
        };

        if (root) {
            calculateLayout(root, canvas.width / 2, 60);

            // Сначала рисуем соединения
            drawConnections(root);

            // Затем узлы (чтобы они были поверх соединений)
            const traverseAndDraw = (node) => {
                if (!node) return;
                drawNode(node);
                node.children.forEach(traverseAndDraw);
            };
            traverseAndDraw(root);
        } else {
            // Если куча пуста
            ctx.fillStyle = '#888';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Куча пуста', canvas.width / 2, canvas.height / 2);
        }
    }, [root]);

    return (
        <div className="container">
            <div className="notification-banner">
                <div className="notification-content">
                    <span className="notification-icon">⚠️</span>
                    <span>
                        Визуализация в режиме тестирования. При сложных операциях возможны временные неточности.
                        Алгоритм продолжает совершенствоваться.
                    </span>
                </div>
            </div>

            <div className="sidebar">
                <button className="home-btn" onClick={() => navigate('/')}>
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
                        onKeyPress={(e) => e.key === 'Enter' && insert(inputValue)}
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

                <button
                    className="extract-btn"
                    onClick={extractMin}
                    disabled={!root || isOperating}
                >
                    Извлечь минимум
                </button>

                <h2>История</h2>
                <div className="history-container">
                    <div className="history">
                        {history.map((item, i) => (
                            <div key={i} className="history-item">{item}</div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="visualization-area">
                <div className="visualization">
                    <h1 className="heap-name">2-3 Куча</h1>
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
                            <h2>Теория: 2-3 Куча (на основе 2-3 дерева)</h2>
                            <button
                                className="close-btn"
                                onClick={() => setShowTheory(false)}
                            >
                                &times;
                            </button>

                            <div className="theory-text">
                                <p><strong>2-3 Куча</strong> — это приоритетная очередь, реализованная на основе 2-3 дерева, где каждый узел содержит 1 или 2 ключа и соответственно 2 или 3 потомка.</p>

                                <p><strong>Основные свойства:</strong></p>
                                <ul>
                                    <li>Все листья находятся на одном уровне</li>
                                    <li>Узел может содержать 1 ключ (2-узел) или 2 ключа (3-узел)</li>
                                    <li>Для 2-узла: левый потомок меньше ключа и меньше правого потомока</li>
                                    <li>Для 3-узла: 1) левый потомок меньше ключа1 меньше среднего потомока, меньше ключа2 и меньше правого потомока</li>
                                    <li>2) ключ1 меньше среднего потомка, меньше ключа2 и меньше правого потомока</li>
                                    <li>3) средний потомок меньше ключа2 и меньше правого потомока</li>
                                    <li>4) ключ2 меньше правого потомока</li>
                                    <li>Высота дерева: O(log n)</li>
                                </ul>

                                <p><strong>Основные операции:</strong></p>
                                <ul>
                                    <li>Вставка: O(log n)</li>
                                    <li>Поиск минимума: O(1) (минимум всегда в корне)</li>
                                    <li>Удаление минимума: O(log n)</li>
                                    <li>Уменьшение ключа: O(log n)</li>
                                </ul>

                                <p><strong>Применение:</strong></p>
                                <ul>
                                    <li>Приоритетные очереди</li>
                                    <li>Алгоритмы на графах (Дейкстра, Прим)</li>
                                    <li>Сортировка (аналог Heapsort)</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};