"use client";

import * as React from "react";
import {
    Home,
    Search,
    Library,
    PlusSquare,
    Heart,
    Music2,
    MoreHorizontal,
    Settings,
    HelpCircle,
    Download
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarProps {
    className?: string;
    onUploadClick?: () => void;
    tracks?: { id: string; name: string }[];
    currentTrackId?: string;
    onTrackSelect?: (id: string) => void;
}

export function Sidebar({ className, onUploadClick, tracks = [], currentTrackId, onTrackSelect }: SidebarProps) {
    return (
        <div className={cn("flex flex-col h-full bg-black text-zinc-400 p-2 gap-2 w-64 shrink-0 overflow-hidden", className)}>
            <div className="bg-zinc-900/50 rounded-lg p-4 flex flex-col gap-4">
                <div className="flex items-center gap-4 px-2 py-1 text-white opacity-90">
                    <Music2 className="w-8 h-8 text-purple-500" />
                    <span className="font-bold text-lg">Remixify</span>
                </div>

                <nav className="flex flex-col gap-1">
                    <SidebarItem icon={Home} label="Home" active />
                    <SidebarItem icon={Search} label="Search" />
                    <SidebarItem icon={Library} label="Your Library" />
                </nav>
            </div>

            <div className="bg-zinc-900/50 rounded-lg flex-1 overflow-hidden flex flex-col">
                <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 px-2 text-zinc-400 hover:text-white transition-colors cursor-pointer">
                        <Library className="w-6 h-6" />
                        <span className="font-bold">Your Library</span>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full"
                        onClick={onUploadClick}
                    >
                        <PlusSquare className="w-5 h-5" />
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto px-2 scrollbar-hide">
                    {tracks.length === 0 ? (
                        <div className="px-2">
                            <div className="bg-zinc-800/50 p-4 rounded-lg mb-4">
                                <h4 className="text-white font-semibold text-sm mb-1">Upload multiple songs</h4>
                                <p className="text-xs text-zinc-400 mb-4">Start your studio session now</p>
                                <Button
                                    size="sm"
                                    className="bg-white text-black hover:bg-zinc-200 font-bold rounded-full px-4"
                                    onClick={onUploadClick}
                                >
                                    Upload Track
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-1">
                            {tracks.map((track) => (
                                <RecentItem
                                    key={track.id}
                                    name={track.name}
                                    type="Original"
                                    active={track.id === currentTrackId}
                                    onClick={() => onTrackSelect?.(track.id)}
                                    image={`https://api.dicebear.com/7.x/identicon/svg?seed=${track.name}`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-zinc-900/50 rounded-lg p-2 flex flex-col gap-1">
                <SidebarItem icon={Settings} label="Settings" />
                <SidebarItem icon={HelpCircle} label="Help & Support" />
                <div className="mt-4 px-3 py-2 border-t border-zinc-800/50">
                    <a
                        href="https://github.com/moazamtech"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-zinc-500 hover:text-purple-400 transition-colors flex items-center gap-2"
                    >
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        Made by moazamtech
                    </a>
                </div>
            </div>
        </div>
    );
}

function SidebarItem({ icon: Icon, label, active = false }: { icon: any, label: string, active?: boolean }) {
    return (
        <div className={cn(
            "flex items-center gap-4 px-3 py-2.5 rounded-md transition-all cursor-pointer group",
            active ? "text-white bg-zinc-800/50" : "hover:text-white"
        )}>
            <Icon className={cn("w-6 h-6", active ? "text-white" : "group-hover:text-white")} />
            <span className="font-bold text-sm">{label}</span>
        </div>
    );
}

function RecentItem({ name, type, image, active = false, onClick }: { name: string, type: string, image: string, active?: boolean, onClick?: () => void }) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "flex items-center gap-3 p-2 rounded-md cursor-pointer group transition-colors",
                active ? "bg-zinc-800/80" : "hover:bg-zinc-800/50"
            )}
        >
            <div className="relative w-12 h-12 rounded-md bg-zinc-800 overflow-hidden flex-shrink-0">
                <img src={image} alt={name} className="w-full h-full object-cover" />
                {active && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="w-1 h-3 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-1 h-4 bg-purple-500 rounded-full animate-bounce mx-0.5" />
                        <div className="w-1 h-3 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.5s]" />
                    </div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium truncate", active ? "text-purple-400" : "text-white")}>{name}</p>
                <p className="text-zinc-500 text-xs">{active ? "Playing" : type} • Remixify</p>
            </div>
            {active && (
                <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
            )}
        </div>
    );
}
