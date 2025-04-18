import { useNavigate } from 'react-router-dom';
import './HomeScreen.css';

export const HomeScreen = () => {
    const navigate = useNavigate();

    const heaps = [
        { name: 'Бинарная куча', path: '/binary-heap' },
        { name: 'Биномиальная куча', path: '/binomial-heap' },
        { name: '2-3 куча', path: '/2-3-heap' },
        { name: 'Фибоначчиева куча', path: '/fibonacci-heap' }
    ];

    return (
        <div className="home-container">
            <h1 className="title">Визуализация куч</h1>
            <div className="structures-grid">
                {heaps.map((heap) => (
                    <div key={heap.name} className="structure-card" onClick={() => navigate(heap.path)}>
                        <h3>{heap.name}</h3>
                    </div>
                ))}
            </div>
        </div>
    );
};