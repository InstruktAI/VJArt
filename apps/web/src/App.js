import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useState, useRef } from 'react';
import { VJEngine } from '@vj-art/engine';
import { ASCIIRenderer } from './Renderer';
function App() {
    const [connected, setConnected] = useState(false);
    const [grid, setGrid] = useState([]);
    const engineRef = useRef(new VJEngine(80, 40));
    useEffect(() => {
        const ws = new WebSocket('ws://localhost:3000');
        ws.onopen = () => {
            setConnected(true);
            console.log('Connected to bridge');
        };
        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'WORKLOAD') {
                engineRef.current.applyWorkload(message.data.segments[0]);
                setGrid([...engineRef.current.getGrid()]);
            }
        };
        ws.onclose = () => {
            setConnected(false);
            console.log('Disconnected from bridge');
        };
        const interval = setInterval(() => {
            engineRef.current.update();
            setGrid([...engineRef.current.getGrid()]);
        }, 100);
        return () => {
            ws.close();
            clearInterval(interval);
        };
    }, []);
    return (_jsxs("div", { style: { backgroundColor: '#000', color: '#0f0', minHeight: '100vh', padding: '1rem', fontFamily: 'monospace' }, children: [_jsxs("header", { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }, children: [_jsx("span", { children: "VJ ART ENGINE" }), _jsxs("span", { children: ["STATUS: ", connected ? 'LIVE' : 'OFFLINE'] })] }), _jsx("main", { children: grid.length > 0 ? (_jsx(ASCIIRenderer, { grid: grid })) : (_jsx("div", { style: { border: '1px solid #333', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }, children: "WAITING FOR WORKLOAD..." })) })] }));
}
export default App;
//# sourceMappingURL=App.js.map