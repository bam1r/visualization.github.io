import { Link } from 'react-router-dom';

export const NavBar = () => {
    return (
        <nav style={{
            background: '#333',
            padding: '10px 20px',
            marginBottom: '20px'
        }}>
            <Link
                to="/"
                style={{
                    color: 'white',
                    textDecoration: 'none',
                    fontSize: '1.2rem'
                }}
            >
                ← На главную
            </Link>
        </nav>
    );
};