import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomeScreen } from './Components/HomeScreen/HomeScreen';
import {BinaryHeapVisualizer} from "./Components/Structures/BinaryHeap/BinaryHeapVisualizer";
import {BinomialHeapVisualizer} from "./Components/Structures/BinomialHeap/BinomialHeapVisualizer";
import {TwoThreeHeapVisualizer} from "./Components/Structures/TwoThreeHeap/TwoThreeHeapVisualizer";
import {FibonacciHeapVisualizer} from "./Components/Structures/FibonacciHeap/FibonacciHeapVisualizer";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<HomeScreen />} />
                <Route path="/binary-heap" element={<BinaryHeapVisualizer />} />
                <Route path="/binomial-heap" element={<BinomialHeapVisualizer />} />
                <Route path="/2-3-heap" element={<TwoThreeHeapVisualizer />} />
                <Route path="/fibonacci-heap" element={<FibonacciHeapVisualizer />} />
            </Routes>
        </BrowserRouter>
    );
}