const canvas = document.getElementById('hero-canvas');
const ctx = canvas.getContext('2d');

let width, height;
let particles =[];

// 3D Space parameters
const focalLength = 1200;
const maxZ = 2000; 
const spaceSize = 2500; 

let mouse = { x: -1000, y: -1000, radius: 150 };

// Camera variables for Parallax effect
let camX = 0;
let camY = 0;
let targetCamX = 0;
let targetCamY = 0;

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    
    // Parallax
    targetCamX = (mouse.x - width / 2) * 0.3; 
    targetCamY = (mouse.y - height / 2) * 0.3;
});

window.addEventListener('mouseout', () => {
    mouse.x = -1000;
    mouse.y = -1000;
    targetCamX = 0;
    targetCamY = 0;
});

class Particle {
    constructor() {
        this.x = (Math.random() - 0.5) * spaceSize;
        this.y = (Math.random() - 0.5) * spaceSize;
        this.z = Math.random() * maxZ;
        
        // Drift speeds
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.vz = (Math.random() - 0.5) * 1.5;
        
        this.baseRadius = Math.random() * 2 + 10;
        this.hoverProgress = 0; 
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.z += this.vz;

        // Bounds
        if (this.z > maxZ) this.z = 0;
        if (this.z < 0) this.z = maxZ;
        if (this.x > spaceSize/2) this.x = -spaceSize/2;
        if (this.x < -spaceSize/2) this.x = spaceSize/2;
        if (this.y > spaceSize/2) this.y = -spaceSize/2;
        if (this.y < -spaceSize/2) this.y = spaceSize/2;

        // Projection
        this.scale = focalLength / (focalLength + this.z);
        this.screenX = (this.x - camX) * this.scale + width / 2;
        this.screenY = (this.y - camY) * this.scale + height / 2;

        // Mouse distance
        const dx = this.screenX - mouse.x;
        const dy = this.screenY - mouse.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        if (dist < mouse.radius) {
            this.hoverProgress += 0.05;
            if (this.hoverProgress > 1) this.hoverProgress = 1;
        } else {
            this.hoverProgress -= 0.02;
            if (this.hoverProgress < 0) this.hoverProgress = 0;
        }

        // Depth Alpha
        this.depthAlpha = Math.max(0, 1 - (this.z / maxZ));
    }
}

function init() {
    particles =[];
    let numParticles = Math.floor((window.innerWidth * window.innerHeight) / 10000);
    numParticles = Math.min(Math.max(numParticles, 50), 200); 

    for (let i = 0; i < numParticles; i++) {
        particles.push(new Particle());
    }
}

function animate() {
    ctx.clearRect(0, 0, width, height);

    camX += (targetCamX - camX) * 0.05;
    camY += (targetCamY - camY) * 0.05;

    particles.forEach(p => p.update());

    // Connection lines
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const p1 = particles[i];
            const p2 = particles[j];

            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const dz = p1.z - p2.z;
            const dist3D = Math.sqrt(dx*dx + dy*dy + dz*dz);

            const maxDist = 500;
            if (dist3D < maxDist) {
                const hoverFactor = Math.max(p1.hoverProgress, p2.hoverProgress);
                const r = Math.floor(59 + (240 - 59) * hoverFactor);
                const g = Math.floor(113 + (138 - 113) * hoverFactor);
                const b = Math.floor(151 + (75 - 151) * hoverFactor);

                const depthOp = (p1.depthAlpha + p2.depthAlpha) / 2;
                const distOp = 1 - (dist3D / maxDist);
                const finalOp = depthOp * distOp * (0.3 + (hoverFactor * 0.5));

                ctx.beginPath();
                ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${finalOp})`;
                ctx.lineWidth = ((p1.scale + p2.scale) / 2) * 1.5;
                ctx.moveTo(p1.screenX, p1.screenY);
                ctx.lineTo(p2.screenX, p2.screenY);
                ctx.stroke();
            }
        }
    }

    particles.sort((a, b) => b.z - a.z);

    // Nodes
    particles.forEach(p => {
        if (p.scale < 0) return;

        const r = Math.floor(59 + (240 - 59) * p.hoverProgress);
        const g = Math.floor(113 + (138 - 113) * p.hoverProgress);
        const b = Math.floor(151 + (75 - 151) * p.hoverProgress);

        const currentRadius = p.baseRadius * p.scale + (p.hoverProgress * 3 * p.scale);

        ctx.beginPath();
        ctx.arc(p.screenX, p.screenY, currentRadius, 0, Math.PI * 2);
        
        if (p.hoverProgress > 0) {
            ctx.shadowBlur = 15 * p.hoverProgress * p.scale;
            ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 1)`;
        } else {
            ctx.shadowBlur = 0;
        }

        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.depthAlpha})`;
        ctx.fill();
    });

    requestAnimationFrame(animate);
}

init();
animate();