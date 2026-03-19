"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Grid2X2,
  ArrowRight,
  RefreshCcw,
  Check,
  PieChart,
  Activity,
  Maximize2
} from "lucide-react";

type PartitionType = "fixed" | "variable";

interface MemoryBlock {
  id: string;
  size: number;
  originalSize: number;
  isAllocated: boolean;
  processId: string | null;
  processSize: number | null;
}

export default function StartupMemoryDashboard() {
  const [blocksInput, setBlocksInput] = useState<string>("100, 500, 200, 300, 600");
  const [processId, setProcessId] = useState<string>("P1");
  const [processSize, setProcessSize] = useState<string>("212");
  const [partitionType, setPartitionType] = useState<PartitionType>("fixed");

  const [memoryBlocks, setMemoryBlocks] = useState<MemoryBlock[]>([]);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const notify = (type: "success" | "error", text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleInitialize = () => {
    const sizes = blocksInput.split(",").map((s) => parseInt(s.trim())).filter((n) => !isNaN(n));
    if (sizes.length < 4) {
      notify("error", "Please provide at least 4 block sizes.");
      return;
    }
    const initialBlocks = sizes.map((size, index) => ({
      id: `blk-${index}-${Date.now()}`,
      size,
      originalSize: size,
      isAllocated: false,
      processId: null,
      processSize: null,
    }));
    setMemoryBlocks(initialBlocks);
    setIsInitialized(true);
    notify("success", "Memory cluster initialized successfully.");
  };

  const handleAllocate = () => {
    const size = parseInt(processSize);
    if (!processId || isNaN(size) || size <= 0) {
      notify("error", "Invalid process parameters.");
      return;
    }

    let updatedBlocks = [...memoryBlocks];
    let targetIndex = -1;
    let maxSize = -1;

    // Worst Fit Strategy
    for (let i = 0; i < updatedBlocks.length; i++) {
      if (!updatedBlocks[i].isAllocated && updatedBlocks[i].size >= size) {
        if (updatedBlocks[i].size > maxSize) {
          maxSize = updatedBlocks[i].size;
          targetIndex = i;
        }
      }
    }

    if (targetIndex === -1) {
      notify("error", `Failed to allocate ${processId}. Insufficient contiguous space.`);
      return;
    }

    const targetBlock = updatedBlocks[targetIndex];

    if (partitionType === "fixed") {
      updatedBlocks[targetIndex] = { ...targetBlock, isAllocated: true, processId, processSize: size };
    } else {
      const remainingSize = targetBlock.size - size;
      const allocatedBlock = { ...targetBlock, size, isAllocated: true, processId, processSize: size };

      if (remainingSize > 0) {
        const newFreeBlock = {
          id: `free-${Date.now()}`,
          size: remainingSize,
          originalSize: remainingSize,
          isAllocated: false,
          processId: null,
          processSize: null,
        };
        updatedBlocks.splice(targetIndex, 1, allocatedBlock, newFreeBlock);
      } else {
        updatedBlocks[targetIndex] = allocatedBlock;
      }
    }

    setMemoryBlocks(updatedBlocks);
    notify("success", `${processId} allocated to ${targetBlock.size}KB block.`);
  };

  const handleNextRequest = () => {
    const match = processId.match(/([a-zA-Z]+)(\d+)/);
    setProcessId(match ? `${match[1]}${parseInt(match[2]) + 1}` : "");
    setProcessSize("");
  };

  const handleReset = () => {
    setIsInitialized(false);
    setMemoryBlocks([]);
    setProcessId("P1");
  };

  const metrics = useMemo(() => {
    const total = memoryBlocks.reduce((acc, b) => acc + (b.isAllocated ? b.size : b.originalSize), 0);
    const used = memoryBlocks.reduce((acc, b) => (b.isAllocated ? acc + (b.processSize || 0) : acc), 0);
    const intFrag = partitionType === "fixed" ? memoryBlocks.reduce((acc, b) => (b.isAllocated ? acc + (b.size - (b.processSize || 0)) : acc), 0) : 0;
    const extFrag = partitionType === "variable" ? memoryBlocks.reduce((acc, b) => (!b.isAllocated ? acc + b.size : acc), 0) : 0;
    const percentage = total === 0 ? 0 : Math.round((used / total) * 100);
    return { total, used, intFrag, extFrag, percentage };
  }, [memoryBlocks, partitionType]);

  return (
    <div className="min-h-screen bg-[#E2E8F0] p-4 md:p-8 flex items-center justify-center font-sans text-[#111111] selection:bg-[#D9482B] selection:text-white">

      {/* Main Dashboard Canvas */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-[1400px] min-h-[85vh] p-8 md:p-12 relative overflow-hidden flex flex-col border border-gray-300">

        {/* Top Notification Toast */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="absolute top-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-3 rounded-full shadow-lg bg-gray-900 border border-gray-800"
            >
              <div className={`w-3 h-3 rounded-full ${notification.type === 'success' ? 'bg-[#4CAF50]' : 'bg-[#F44336]'}`} />
              <span className="text-sm font-bold tracking-tight text-white">
                {notification.text}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dashboard Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#111111] rounded-full flex items-center justify-center text-white shadow-md border-2 border-gray-300">
              <span className="text-xl font-extrabold tracking-tighter">Mº</span>
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-[#111111] leading-tight">Memory<br />Dashboard</h1>
            </div>
          </div>

          <div className="flex-1 md:text-center">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-[#111111]">
              System ready.<span className="text-2xl ml-2">👋</span><br />
              <span className="text-gray-600 font-medium">Let's allocate some processes.</span>
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleReset}
              className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-300 cursor-pointer hover:bg-gray-200 hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-[#111111]"
              aria-label="Reset Dashboard"
            >
              <RefreshCcw className="w-5 h-5 text-gray-800 font-bold" />
            </button>
            <div className="hidden md:flex flex-col items-end">
              <span className="text-base font-black tracking-tight text-[#111111]">Admin User</span>
              <span className="text-sm text-gray-600 font-bold">Worst-Fit Policy</span>
            </div>
          </div>
        </header>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">

          {/* Left Column: Controls & Metrics */}
          <div className="lg:col-span-4 flex flex-col gap-8">

            {/* Action Widget */}
            <div className="bg-gray-50 rounded-[2rem] p-8 border-2 border-gray-200 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-black tracking-tight text-xl text-[#111111]">Allocation Manager</h3>
                <span className="bg-white px-3 py-1.5 rounded-full text-xs font-bold shadow-sm border-2 border-gray-200 flex items-center gap-1.5 text-gray-800">
                  <Activity className="w-3.5 h-3.5 text-[#D9482B]" /> Active
                </span>
              </div>

              {!isInitialized ? (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-widest">Initial Block Sizes (KB)</label>
                    <input
                      type="text"
                      value={blocksInput}
                      onChange={(e) => setBlocksInput(e.target.value)}
                      className="w-full bg-white border-2 border-gray-300 rounded-2xl px-5 py-4 text-base font-bold text-gray-900 focus:outline-none focus:border-[#111111] transition-all shadow-sm"
                      placeholder="100, 500, 200..."
                    />
                  </div>
                  <button
                    onClick={handleInitialize}
                    className="w-full bg-[#111111] hover:bg-gray-900 text-white font-bold py-4 rounded-full transition-all shadow-md flex justify-center items-center gap-2 text-lg"
                  >
                    Boot Cluster
                  </button>
                </div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-widest pl-2">Process ID</label>
                      <input
                        value={processId}
                        onChange={(e) => setProcessId(e.target.value)}
                        className="w-full bg-white border-2 border-gray-300 rounded-2xl px-4 py-3 text-base font-bold text-gray-900 focus:outline-none focus:border-[#111111] transition-all shadow-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-widest pl-2">Size (KB)</label>
                      <input
                        type="number"
                        value={processSize}
                        onChange={(e) => setProcessSize(e.target.value)}
                        className="w-full bg-white border-2 border-gray-300 rounded-2xl px-4 py-3 text-base font-bold text-gray-900 focus:outline-none focus:border-[#111111] transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  {/* Custom Pill Toggle for Partition Type */}
                  <div className="bg-gray-100 p-1.5 rounded-full border-2 border-gray-300 flex relative shadow-inner">
                    {["fixed", "variable"].map((type) => (
                      <button
                        key={type}
                        onClick={() => { setPartitionType(type as PartitionType); handleReset(); }}
                        className={`flex-1 py-3 text-sm font-bold rounded-full z-10 capitalize transition-colors ${partitionType === type ? 'text-white' : 'text-gray-700 hover:text-gray-900'}`}
                      >
                        {type} Partition
                      </button>
                    ))}
                    <motion.div
                      layoutId="pill-bg"
                      className="absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-[#111111] rounded-full shadow-md"
                      initial={false}
                      animate={{ left: partitionType === "fixed" ? "6px" : "50%" }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  </div>

                  <div className="pt-2 flex flex-col gap-3">
                    <button
                      onClick={handleAllocate}
                      className="w-full bg-[#D9482B] hover:bg-[#B73B22] text-white font-bold py-4 rounded-full transition-all shadow-lg shadow-[#D9482B]/40 flex justify-center items-center gap-2 text-lg"
                    >
                      Allocate Process <ArrowRight className="w-5 h-5 font-bold" />
                    </button>
                    <button
                      onClick={handleNextRequest}
                      className="w-full bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-800 font-bold py-3.5 rounded-full transition-all text-base"
                    >
                      Next Request
                    </button>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Metrics Widget (Only visible when initialized) */}
            <AnimatePresence>
              {isInitialized && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-2 gap-4"
                >
                  <div className="bg-white rounded-[2rem] p-6 border-2 border-gray-200 shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-full border-[6px] border-gray-100 border-t-[#111111] flex items-center justify-center mb-4">
                      <span className="text-base font-black text-[#111111]">{metrics.percentage}%</span>
                    </div>
                    <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">Utilized</span>
                    <span className="text-xl font-black text-[#111111] mt-1">{metrics.used} <span className="text-sm font-bold text-gray-500">KB</span></span>
                  </div>

                  <div className="bg-white rounded-[2rem] p-6 border-2 border-gray-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-3">
                        <PieChart className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">Fragmentation</span>
                    </div>
                    <div>
                      <span className="text-3xl font-black text-[#D9482B]">
                        {partitionType === "fixed" ? metrics.intFrag : metrics.extFrag}
                      </span>
                      <span className="text-sm font-bold text-gray-500 ml-1">KB</span>
                      <p className="text-xs text-gray-600 font-bold mt-1 leading-tight">
                        {partitionType === "fixed" ? "Internal waste" : "External free space"}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

          {/* Right Column: Visualization Map */}
          <div className="lg:col-span-8">
            <div className="bg-gray-50 rounded-[2rem] border-2 border-gray-200 h-full min-h-[500px] p-8 flex flex-col shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-black tracking-tight text-xl text-[#111111] flex items-center gap-2">
                  <Grid2X2 className="w-6 h-6 text-gray-700" /> Cluster Visualization
                </h3>
                {isInitialized && (
                  <div className="flex gap-5 text-sm font-bold text-gray-700">
                    <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-white border-2 border-gray-400" /> Free</span>
                    <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#111111]" /> Allocated</span>
                    {partitionType === "fixed" && <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#D9482B]" /> Fragment</span>}
                  </div>
                )}
              </div>

              {!isInitialized ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                  <Maximize2 className="w-16 h-16 mb-4 stroke-[1.5]" />
                  <p className="text-xl font-bold tracking-tight text-gray-600">Map is currently offline.</p>
                </div>
              ) : (
                <motion.div layout className="grid grid-cols-2 xl:grid-cols-3 gap-5 content-start">
                  <AnimatePresence>
                    {memoryBlocks.map((block) => (
                      <motion.div
                        key={block.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className={`relative rounded-3xl p-6 transition-all duration-300 min-h-[160px] flex flex-col justify-between border-2 ${block.isAllocated
                            ? "bg-[#111111] text-white border-[#111111] shadow-xl"
                            : "bg-white text-gray-800 border-gray-400"
                          }`}
                      >
                        {/* Header */}
                        <div className="flex justify-between items-start">
                          <span className={`text-xs font-bold uppercase tracking-widest ${block.isAllocated ? 'text-gray-300' : 'text-gray-500'}`}>
                            {block.size}KB Block
                          </span>
                          {block.isAllocated && (
                            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                              <Check className="w-4 h-4 text-white font-bold" />
                            </div>
                          )}
                        </div>

                        {/* Center Content */}
                        <div className="mt-4 mb-2">
                          {block.isAllocated ? (
                            <div>
                              <div className="text-4xl font-black tracking-tighter mb-1 text-white">{block.processId}</div>
                              <div className="text-sm font-bold text-gray-300">{block.processSize}KB Used</div>
                            </div>
                          ) : (
                            <div className="text-2xl font-black tracking-tight text-gray-600 py-2">Available</div>
                          )}
                        </div>

                        {/* Fragmentation Visualization (Bottom edge) */}
                        {block.isAllocated && partitionType === "fixed" && block.originalSize > (block.processSize || 0) && (
                          <div className="absolute bottom-4 right-6 bg-[#D9482B] px-3 py-1.5 rounded-full shadow-md">
                            <span className="text-xs font-bold text-white uppercase tracking-widest">
                              {block.originalSize - (block.processSize || 0)}KB Waste
                            </span>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}