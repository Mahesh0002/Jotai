import React, { useEffect, useMemo, useState } from "react";
import {
    Brain,
    Coffee,
    Laptop,
    Users,
    Plus,
    Play,
    MoreHorizontal,
    Clock3,
    X,
    Check,
} from "lucide-react";

import "./FocusPlan.css";

type FocusBlockType =
    | "deep-work"
    | "break"
    | "project"
    | "meeting";

interface FocusBlock {
    id: number;
    start: string;
    end: string;
    title: string;
    type: FocusBlockType;
    description?: string;
}

interface FocusPlanProps {
    onStartFocus?: (block: FocusBlock) => void;
}

const INITIAL_BLOCKS: FocusBlock[] = [
    {
        id: 1,
        start: "09:00",
        end: "12:00",
        title: "Deep Work",
        type: "deep-work",
        description: "NLP assignment & research",
    },
    {
        id: 2,
        start: "12:00",
        end: "13:00",
        title: "Break",
        type: "break",
        description: "Lunch & reset",
    },
    {
        id: 3,
        start: "13:00",
        end: "16:00",
        title: "Project Work",
        type: "project",
        description: "Traffic severity classifier",
    },
    {
        id: 4,
        start: "16:00",
        end: "18:00",
        title: "Meetings & Admin",
        type: "meeting",
        description: "Emails, meetings & planning",
    },
];

const BLOCK_TYPES = [
    {
        value: "deep-work",
        label: "Deep Work",
    },
    {
        value: "project",
        label: "Project Work",
    },
    {
        value: "break",
        label: "Break",
    },
    {
        value: "meeting",
        label: "Meeting",
    },
];

function timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
}

function formatTime(time: string): string {
    const [hours, minutes] = time.split(":").map(Number);

    const suffix = hours >= 12 ? "PM" : "AM";
    const displayHour = hours % 12 || 12;

    return `${displayHour}:${minutes.toString().padStart(2, "0")} ${suffix}`;
}

function calculateDuration(start: string, end: string): string {
    const difference =
        timeToMinutes(end) - timeToMinutes(start);

    if (difference <= 0) {
        return "0m";
    }

    const hours = Math.floor(difference / 60);
    const minutes = difference % 60;

    if (hours === 0) {
        return `${minutes}m`;
    }

    if (minutes === 0) {
        return `${hours}h`;
    }

    return `${hours}h ${minutes}m`;
}

function getBlockIcon(type: FocusBlockType) {
    switch (type) {
        case "deep-work":
            return Brain;

        case "break":
            return Coffee;

        case "project":
            return Laptop;

        case "meeting":
            return Users;

        default:
            return Clock3;
    }
}

function getCurrentMinutes(): number {
    const now = new Date();

    return now.getHours() * 60 + now.getMinutes();
}

const FocusPlan: React.FC<FocusPlanProps> = ({
    onStartFocus,
}) => {
    const [blocks, setBlocks] =
        useState<FocusBlock[]>(INITIAL_BLOCKS);

    const [currentTime, setCurrentTime] =
        useState(getCurrentMinutes());

    const [showAddModal, setShowAddModal] =
        useState(false);

    const [selectedBlock, setSelectedBlock] =
        useState<FocusBlock | null>(null);

    const [newBlock, setNewBlock] = useState({
        start: "18:00",
        end: "19:00",
        title: "",
        type: "deep-work" as FocusBlockType,
        description: "",
    });

    /*
     * Update current time every minute.
     */
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(getCurrentMinutes());
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    /*
     * Calculate total planned time.
     */
    const totalMinutes = useMemo(() => {
        return blocks.reduce((total, block) => {
            return (
                total +
                Math.max(
                    0,
                    timeToMinutes(block.end) -
                    timeToMinutes(block.start)
                )
            );
        }, 0);
    }, [blocks]);

    /*
     * Determine which block is currently active.
     */
    const activeBlock = useMemo(() => {
        return blocks.find((block) => {
            const start = timeToMinutes(block.start);
            const end = timeToMinutes(block.end);

            return currentTime >= start && currentTime < end;
        });
    }, [blocks, currentTime]);

    /*
     * Timeline boundaries.
     *
     * 08:00 → 20:00
     */
    const timelineStart = 8 * 60;
    const timelineEnd = 20 * 60;
    const timelineDuration =
        timelineEnd - timelineStart;

    /*
     * Convert a time into horizontal percentage.
     */
    const getPosition = (time: string) => {
        const minutes = timeToMinutes(time);

        return (
            ((minutes - timelineStart) /
                timelineDuration) *
            100
        );
    };

    /*
     * Current time indicator.
     */
    const currentTimePosition =
        ((currentTime - timelineStart) /
            timelineDuration) *
        100;

    const addBlock = () => {
        if (!newBlock.title.trim()) {
            return;
        }

        if (
            timeToMinutes(newBlock.end) <=
            timeToMinutes(newBlock.start)
        ) {
            return;
        }

        const block: FocusBlock = {
            id: Date.now(),
            start: newBlock.start,
            end: newBlock.end,
            title: newBlock.title,
            type: newBlock.type,
            description: newBlock.description,
        };

        setBlocks((previous) =>
            [...previous, block].sort(
                (a, b) =>
                    timeToMinutes(a.start) -
                    timeToMinutes(b.start)
            )
        );

        setNewBlock({
            start: "18:00",
            end: "19:00",
            title: "",
            type: "deep-work",
            description: "",
        });

        setShowAddModal(false);
    };

    const deleteBlock = (id: number) => {
        setBlocks((previous) =>
            previous.filter((block) => block.id !== id)
        );

        setSelectedBlock(null);
    };

    return (
        <>
            <section className="focus-plan">

                {/* HEADER */}
                <div className="focus-plan-header">

                    <div>
                        <div className="focus-plan-eyebrow">
                            <span className="focus-plan-eyebrow-dot" />
                            TODAY'S FOCUS PLAN
                        </div>

                        <h2>Structure your day</h2>

                        <p>
                            Plan focused work around your energy and
                            schedule.
                        </p>
                    </div>

                    <div className="focus-plan-header-actions">

                        <div className="focus-plan-total">
                            <Clock3 size={14} />
                            <span>
                                {Math.floor(totalMinutes / 60)}h{" "}
                                {totalMinutes % 60 > 0
                                    ? `${totalMinutes % 60}m`
                                    : ""}
                            </span>
                            <small>planned</small>
                        </div>

                        <button
                            className="focus-plan-add"
                            onClick={() => setShowAddModal(true)}
                        >
                            <Plus size={16} />
                            Add block
                        </button>

                    </div>
                </div>


                {/* ACTIVE SESSION */}
                {activeBlock && (
                    <div className="focus-plan-active">

                        <div className="focus-plan-active-left">

                            <div className="focus-plan-live">
                                <span />
                                LIVE
                            </div>

                            <div>
                                <strong>
                                    {activeBlock.title}
                                </strong>

                                <span>
                                    {activeBlock.start} —{" "}
                                    {activeBlock.end}
                                </span>
                            </div>

                        </div>

                        <button
                            onClick={() =>
                                onStartFocus?.(activeBlock)
                            }
                            className="focus-plan-start"
                        >
                            <Play size={14} />
                            Start Focus
                        </button>

                    </div>
                )}


                {/* TIMELINE */}
                <div className="focus-plan-timeline-wrapper">

                    <div className="focus-plan-hours">

                        {[
                            "08:00",
                            "10:00",
                            "12:00",
                            "14:00",
                            "16:00",
                            "18:00",
                            "20:00",
                        ].map((hour) => (
                            <span key={hour}>
                                {formatTime(hour)}
                            </span>
                        ))}

                    </div>


                    <div className="focus-plan-timeline">

                        {/* Grid */}
                        <div className="focus-plan-grid">
                            {Array.from(
                                { length: 7 },
                                (_, index) => (
                                    <div key={index} />
                                )
                            )}
                        </div>


                        {/* Current time */}
                        {currentTime >= timelineStart &&
                            currentTime <= timelineEnd && (
                                <div
                                    className="focus-plan-now"
                                    style={{
                                        left: `${currentTimePosition}%`,
                                    }}
                                >
                                    <span>NOW</span>
                                </div>
                            )}


                        {/* Blocks */}
                        {blocks.map((block) => {
                            const left =
                                getPosition(block.start);

                            const right =
                                getPosition(block.end);

                            const width = right - left;

                            const Icon =
                                getBlockIcon(block.type);

                            const isActive =
                                activeBlock?.id === block.id;

                            return (
                                <button
                                    key={block.id}
                                    className={`focus-plan-block focus-plan-${block.type} ${isActive
                                            ? "focus-plan-block-active"
                                            : ""
                                        }`}
                                    style={{
                                        left: `${left}%`,
                                        width: `${width}%`,
                                    }}
                                    onClick={() =>
                                        setSelectedBlock(block)
                                    }
                                >

                                    <div className="focus-plan-block-icon">
                                        <Icon size={16} />
                                    </div>

                                    <div className="focus-plan-block-content">

                                        <strong>
                                            {block.title}
                                        </strong>

                                        <span>
                                            {block.start} — {block.end}
                                        </span>

                                        {block.description && (
                                            <small>
                                                {block.description}
                                            </small>
                                        )}

                                    </div>

                                </button>
                            );
                        })}

                    </div>
                </div>


                {/* FOOTER */}
                <div className="focus-plan-footer">

                    <div className="focus-plan-legend">

                        <span>
                            <i className="legend-deep-work" />
                            Deep Work
                        </span>

                        <span>
                            <i className="legend-project" />
                            Project
                        </span>

                        <span>
                            <i className="legend-break" />
                            Break
                        </span>

                        <span>
                            <i className="legend-meeting" />
                            Meeting
                        </span>

                    </div>

                    <button className="focus-plan-more">
                        <MoreHorizontal size={18} />
                    </button>

                </div>

            </section>


            {/* BLOCK DETAILS */}
            {selectedBlock && (
                <div
                    className="focus-modal-backdrop"
                    onClick={() => setSelectedBlock(null)}
                >

                    <div
                        className="focus-modal"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >

                        <div className="focus-modal-header">

                            <div>
                                <span className="focus-modal-label">
                                    FOCUS BLOCK
                                </span>

                                <h3>
                                    {selectedBlock.title}
                                </h3>
                            </div>

                            <button
                                onClick={() =>
                                    setSelectedBlock(null)
                                }
                            >
                                <X size={18} />
                            </button>

                        </div>


                        <div className="focus-modal-time">
                            <Clock3 size={17} />

                            <strong>
                                {formatTime(selectedBlock.start)}
                            </strong>

                            <span>→</span>

                            <strong>
                                {formatTime(selectedBlock.end)}
                            </strong>

                            <small>
                                {calculateDuration(
                                    selectedBlock.start,
                                    selectedBlock.end
                                )}
                            </small>
                        </div>


                        {selectedBlock.description && (
                            <p className="focus-modal-description">
                                {selectedBlock.description}
                            </p>
                        )}


                        <div className="focus-modal-actions">

                            <button
                                className="focus-modal-start"
                                onClick={() => {
                                    onStartFocus?.(
                                        selectedBlock
                                    );

                                    setSelectedBlock(null);
                                }}
                            >
                                <Play size={15} />
                                Start Focus
                            </button>

                            <button
                                className="focus-modal-delete"
                                onClick={() =>
                                    deleteBlock(
                                        selectedBlock.id
                                    )
                                }
                            >
                                Delete block
                            </button>

                        </div>

                    </div>

                </div>
            )}


            {/* ADD BLOCK MODAL */}
            {showAddModal && (
                <div
                    className="focus-modal-backdrop"
                    onClick={() =>
                        setShowAddModal(false)
                    }
                >

                    <div
                        className="focus-modal focus-add-modal"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >

                        <div className="focus-modal-header">

                            <div>
                                <span className="focus-modal-label">
                                    FOCUS PLAN
                                </span>

                                <h3>
                                    Add focus block
                                </h3>
                            </div>

                            <button
                                onClick={() =>
                                    setShowAddModal(false)
                                }
                            >
                                <X size={18} />
                            </button>

                        </div>


                        <div className="focus-form">

                            <label>
                                Title

                                <input
                                    value={newBlock.title}
                                    placeholder="e.g. Research paper"
                                    onChange={(event) =>
                                        setNewBlock({
                                            ...newBlock,
                                            title:
                                                event.target.value,
                                        })
                                    }
                                />
                            </label>


                            <label>
                                Type

                                <select
                                    value={newBlock.type}
                                    onChange={(event) =>
                                        setNewBlock({
                                            ...newBlock,
                                            type: event.target
                                                .value as FocusBlockType,
                                        })
                                    }
                                >
                                    {BLOCK_TYPES.map(
                                        (type) => (
                                            <option
                                                key={type.value}
                                                value={type.value}
                                            >
                                                {type.label}
                                            </option>
                                        )
                                    )}
                                </select>

                            </label>


                            <div className="focus-form-row">

                                <label>
                                    Start

                                    <input
                                        type="time"
                                        value={newBlock.start}
                                        onChange={(event) =>
                                            setNewBlock({
                                                ...newBlock,
                                                start:
                                                    event.target.value,
                                            })
                                        }
                                    />
                                </label>


                                <label>
                                    End

                                    <input
                                        type="time"
                                        value={newBlock.end}
                                        onChange={(event) =>
                                            setNewBlock({
                                                ...newBlock,
                                                end:
                                                    event.target.value,
                                            })
                                        }
                                    />
                                </label>

                            </div>


                            <label>
                                Description

                                <textarea
                                    value={newBlock.description}
                                    placeholder="What will you work on?"
                                    onChange={(event) =>
                                        setNewBlock({
                                            ...newBlock,
                                            description:
                                                event.target.value,
                                        })
                                    }
                                />

                            </label>

                        </div>


                        <div className="focus-modal-actions">

                            <button
                                className="focus-modal-cancel"
                                onClick={() =>
                                    setShowAddModal(false)
                                }
                            >
                                Cancel
                            </button>

                            <button
                                className="focus-modal-start"
                                onClick={addBlock}
                            >
                                <Check size={15} />
                                Add to plan
                            </button>

                        </div>

                    </div>

                </div>
            )}
        </>
    );
};

export default FocusPlan;