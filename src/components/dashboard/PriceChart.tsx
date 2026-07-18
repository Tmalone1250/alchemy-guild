import { useEffect, useRef, useState } from 'react';
import { createChart, AreaSeries, UTCTimestamp } from 'lightweight-charts';
import { Activity } from 'lucide-react';
export default function PriceChart({ totalBurned }: { totalBurned: number }) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // 1. Create Chart Instance
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: '#000000' },
        textColor: '#d4af37',
        fontFamily: 'monospace',
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: false },
      },
      rightPriceScale: {
        borderColor: 'rgba(212, 175, 55, 0.2)',
      },
      timeScale: {
        borderColor: 'rgba(212, 175, 55, 0.2)',
        timeVisible: true,
        secondsVisible: false,
      },
      width: chartContainerRef.current.clientWidth,
      height: 350,
    });

    // 2. Add Area Series with gold accents
    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor: '#d4af37',
      topColor: 'rgba(212, 175, 55, 0.3)',
      bottomColor: 'rgba(212, 175, 55, 0.0)',
      lineWidth: 2,
      priceFormat: {
        type: 'price',
        precision: 2,
        minMove: 0.01,
      },
    });

    // The Algorithmic USD Oracle Logic
    const basePrice = 0.25; // Base price of $0.25 USD
    
    // Simulate historical data leading up to the current burn value
    const generateHistory = () => {
      // 520 tokens burned * 0.001 = +$0.52 added to the price
      const burnBonus = (totalBurned || 0) * 0.001; 
      const targetPrice = basePrice + burnBonus;
      
      const nowSecs = Math.floor(Date.now() / 1000);
      const startSecs = nowSecs - 1200; 
      const historyData: { time: UTCTimestamp; value: number }[] = [];
      
      for (let i = 0; i < 120; i++) {
        const time = (startSecs + i * 10) as UTCTimestamp;
        const progress = i / 120;
        const randomFactor = (Math.random() - 0.5) * 0.02; // +/- 2 cents noise
        const value = basePrice + (burnBonus * progress) + randomFactor;
        historyData.push({ time, value });
      }
      
      areaSeries.setData(historyData);
      chart.timeScale().fitContent();
      setCurrentPrice(targetPrice);
      setLoading(false);
    };

    generateHistory();

    // Setup 10s polling interval for streaming new points based on live burn
    const interval = setInterval(() => {
      const burnBonus = (Number(totalBurned) || 0) * 0.001; 
      const volatility = (Math.random() - 0.5) * 0.02; // +/- 2 cents
      const livePrice = basePrice + burnBonus + volatility;

      setCurrentPrice(livePrice);
      
      areaSeries.update({
        time: Math.floor(Date.now() / 1000) as UTCTimestamp,
        value: livePrice 
      });
    }, 10000);

    // 5. Handle Resize Observer
    const resizeObserver = new ResizeObserver(entries => {
      if (entries.length === 0 || !entries[0].contentRect) return;
      chart.resize(entries[0].contentRect.width, 350);
    });

    resizeObserver.observe(chartContainerRef.current);

    // 6. Cleanup
    return () => {
      clearInterval(interval);
      resizeObserver.disconnect();
      chart.remove();
    };
  }, []);

  return (
    <div className="glass-panel p-6 border border-primary/20 bg-black/60 rounded-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary animate-pulse">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground font-cinzel">GUILD / USD Market</h3>
            <p className="text-xs text-muted-foreground">Real-time price movements</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground font-lato">Live Price</div>
          <div className="text-2xl font-bold font-mono text-gold-gradient">
            {currentPrice !== null ? `$${currentPrice.toFixed(2)} USD` : 'Loading...'}
          </div>
        </div>
      </div>

      <div className="relative w-full h-[350px] bg-black rounded-lg overflow-hidden border border-white/[0.05]">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
            <span className="text-sm text-primary/80 animate-pulse font-mono">Calibrating TradingView Feed...</span>
          </div>
        )}
        <div ref={chartContainerRef} className="w-full h-full" />
      </div>
    </div>
  );
}
