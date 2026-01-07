import { useState, useEffect } from "react";
import { motion, useMotionValue } from "framer-motion";
import { cn } from "../../lib/utils";

export const PhotoGallery = ({
    animationDelay = 0.5,
}: {
    animationDelay?: number;
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const visibilityTimer = setTimeout(() => {
            setIsVisible(true);
        }, animationDelay * 1000);

        const animationTimer = setTimeout(
            () => {
                setIsLoaded(true);
            },
            (animationDelay + 0.4) * 1000
        );

        return () => {
            clearTimeout(visibilityTimer);
            clearTimeout(animationTimer);
        };
    }, [animationDelay]);

    const containerVariants = {
        hidden: { opacity: 1 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15,
                delayChildren: 0.1,
            },
        },
    };

    const photoVariants = {
        hidden: () => ({
            x: 0,
            y: 0,
            rotate: 0,
            scale: 1,
        }),
        visible: (custom: { x: string; y: string; order: number }) => ({
            x: custom.x,
            y: custom.y,
            rotate: 0,
            scale: 1,
            transition: {
                type: "spring" as const,
                stiffness: 70,
                damping: 12,
                mass: 1,
                delay: custom.order * 0.15,
            },
        }),
    };

    const photos = [
        {
            id: 1,
            order: 0,
            x: "-400px",
            y: "15px",
            zIndex: 50,
            direction: "left" as Direction,
            src: "/examples/example1.jpg",
        },
        {
            id: 2,
            order: 1,
            x: "-200px",
            y: "32px",
            zIndex: 40,
            direction: "left" as Direction,
            src: "/examples/example2.jpg",
        },
        {
            id: 3,
            order: 2,
            x: "0px",
            y: "8px",
            zIndex: 30,
            direction: "right" as Direction,
            src: "/examples/example3.jpg",
        },
        {
            id: 4,
            order: 3,
            x: "200px",
            y: "22px",
            zIndex: 20,
            direction: "right" as Direction,
            src: "/examples/example4.jpg",
        },
    ];

    return (
        <div className="relative py-8">
            <p className="text-center text-xs font-light uppercase tracking-widest text-neutral-400 mb-6">
                Inspiration
            </p>
            {/* Mobile: h-[300px], Desktop: h-[500px] */}
            <div className="relative h-[300px] md:h-[500px] w-full flex items-center justify-center overflow-hidden">
                <motion.div
                    className="relative mx-auto flex w-full max-w-7xl justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isVisible ? 1 : 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                >
                    <motion.div
                        className="relative flex w-full justify-center"
                        variants={containerVariants}
                        initial="hidden"
                        animate={isLoaded ? "visible" : "hidden"}
                    >
                        {/* Mobile: 200px, Desktop: 420px */}
                        <div className="relative h-[200px] w-[200px] md:h-[420px] md:w-[420px]">
                            {[...photos].reverse().map((photo) => (
                                <motion.div
                                    key={photo.id}
                                    className="absolute left-0 top-0"
                                    style={{ zIndex: photo.zIndex }}
                                    variants={photoVariants}
                                    custom={{
                                        x: photo.x,
                                        y: photo.y,
                                        order: photo.order,
                                    }}
                                >
                                    <Photo
                                        src={photo.src}
                                        alt="Example photo"
                                        direction={photo.direction}
                                    />
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
};

function getRandomNumberInRange(min: number, max: number): number {
    if (min >= max) {
        throw new Error("Min value should be less than max value");
    }
    return Math.random() * (max - min) + min;
}

type Direction = "left" | "right";

export const Photo = ({
    src,
    alt,
    className,
    direction,
}: {
    src: string;
    alt: string;
    className?: string;
    direction?: Direction;
}) => {
    const [rotation, setRotation] = useState<number>(0);
    const x = useMotionValue(200);
    const y = useMotionValue(200);

    useEffect(() => {
        const randomRotation =
            getRandomNumberInRange(1, 4) * (direction === "left" ? -1 : 1);
        setRotation(randomRotation);
    }, [direction]);

    function handleMouse(event: React.MouseEvent<HTMLDivElement>) {
        const rect = event.currentTarget.getBoundingClientRect();
        x.set(event.clientX - rect.left);
        y.set(event.clientY - rect.top);
    }

    const resetMouse = () => {
        x.set(200);
        y.set(200);
    };

    return (
        <motion.div
            drag
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            whileTap={{ scale: 1.2, zIndex: 9999 }}
            whileHover={{
                scale: 1.1,
                rotateZ: 2 * (direction === "left" ? -1 : 1),
                zIndex: 9999,
            }}
            whileDrag={{
                scale: 1.1,
                zIndex: 9999,
            }}
            initial={{ rotate: 0 }}
            animate={{ rotate: rotation }}
            className={cn(
                className,
                "relative mx-auto shrink-0 cursor-grab active:cursor-grabbing",
                // Responsive sizing: 200px on mobile, 420px on desktop
                "w-[200px] h-[200px] md:w-[420px] md:h-[420px]"
            )}
            style={{
                perspective: 400,
                transform: `rotate(0deg) rotateX(0deg) rotateY(0deg)`,
                zIndex: 1,
                WebkitTouchCallout: "none",
                WebkitUserSelect: "none",
                userSelect: "none",
                touchAction: "none",
            }}
            onMouseMove={handleMouse}
            onMouseLeave={resetMouse}
            draggable={false}
            tabIndex={0}
        >
            <div className="relative h-full w-full overflow-hidden rounded-3xl shadow-lg bg-white">
                <img
                    className="rounded-3xl w-full h-full object-contain"
                    src={src}
                    alt={alt}
                    draggable={false}
                />
            </div>
        </motion.div>
    );
};
