// animations/rippleEffect.js

/**
 * Aplica um efeito ripple ao manter o clique/ toque em um elemento.
 * Ao soltar dentro do elemento, remove o ripple e chama onReleaseCallback().
 * Ao soltar fora, o ripple encolhe e desaparece sem chamar o callback.
 *
 * Este código foi reforçado para evitar acúmulo de ripples e ouvintes de eventos.
 */
export function applyHoldRippleEffect(element, onReleaseCallback = () => {}) {
    if (!element) return;

    let ripple = null;
    let isPressed = false;
    let pressInside = true;
    let rect = null;

    // Listeners globais
    let mouseUpListener = null;
    let touchEndListener = null;
    let touchCancelListener = null;

    function getCoordinates(event) {
        if (event.type.startsWith('touch') && event.touches && event.touches.length > 0) {
            return { x: event.touches[0].clientX, y: event.touches[0].clientY };
        }
        return { x: event.clientX, y: event.clientY };
    }

    function removeAllRipples() {
        // Remove qualquer ripple remanescente do DOM
        const oldRipples = element.querySelectorAll('.ripple-hold');
        oldRipples.forEach(r => r.remove());
    }

    function cleanupGlobalListeners() {
        if (mouseUpListener) {
            document.removeEventListener('mouseup', mouseUpListener);
            mouseUpListener = null;
        }
        if (touchEndListener) {
            document.removeEventListener('touchend', touchEndListener);
            touchEndListener = null;
        }
        if (touchCancelListener) {
            document.removeEventListener('touchcancel', touchCancelListener);
            touchCancelListener = null;
        }
    }

    function cleanupRipple(callCallback = false) {
        if (ripple) {
            ripple.removeEventListener('transitionend', removeRippleAfterTransition);
            ripple.remove();
            ripple = null;
        }
        if (callCallback) {
            onReleaseCallback();
        }
    }

    function startRipple(x, y) {
        removeAllRipples(); // garante limpeza total antes de criar um novo ripple

        ripple = document.createElement('span');
        ripple.classList.add('ripple-hold', 'ripple-expand');
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;

        const maxDim = Math.max(rect.width, rect.height);
        ripple.style.width = `${maxDim * 2}px`;
        ripple.style.height = `${maxDim * 2}px`;

        element.appendChild(ripple);

        requestAnimationFrame(() => {
            if (ripple) {
                ripple.style.transform = 'translate(-50%, -50%) scale(1)';
            }
        });
    }

    function handlePress(event) {
        // Previne comportamentos padrão (e.g. highlight azul em mobile)
        event.stopPropagation();
        if (event.cancelable !== false) {
            event.preventDefault();
        }

        // Se já estava pressionado, limpa o estado anterior
        if (isPressed) {
            cleanupGlobalListeners();
            cleanupRipple(false);
            isPressed = false;
        }

        isPressed = true;
        pressInside = true;
        rect = element.getBoundingClientRect();

        const { x: clientX, y: clientY } = getCoordinates(event);
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        startRipple(x, y);

        mouseUpListener = () => handleGlobalRelease();
        touchEndListener = () => handleGlobalRelease();
        touchCancelListener = () => handleGlobalRelease();

        document.addEventListener('mouseup', mouseUpListener, { once: true });
        document.addEventListener('touchend', touchEndListener, { once: true });
        document.addEventListener('touchcancel', touchCancelListener, { once: true });
    }

    function handleGlobalRelease() {
        if (!isPressed) return;
        isPressed = false;

        cleanupGlobalListeners();

        if (!ripple) return;

        if (pressInside) {
            // Soltou dentro do elemento
            cleanupRipple(true); // chama callback
        } else {
            // Soltou fora do elemento: encolhe o ripple
            ripple.addEventListener('transitionend', removeRippleAfterTransition);
            ripple.classList.remove('ripple-expand');
            ripple.classList.add('ripple-collapse');

            requestAnimationFrame(() => {
                if (ripple) {
                    ripple.style.transform = 'translate(-50%, -50%) scale(0)';
                    ripple.style.opacity = '0';
                }
            });

            // Caso a animação não ocorra ou a transição não dispare, fallback após um tempo
            setTimeout(() => {
                if (ripple) {
                    cleanupRipple(false);
                }
            }, 2000); // tempo máximo para garantir limpeza
        }
    }

    function removeRippleAfterTransition() {
        // Ao final da transição, remove o ripple se ainda existir
        if (ripple) {
            cleanupRipple(false); // não chama callback, pois soltou fora
        }
    }

    function handleLeave() {
        if (isPressed) {
            pressInside = false;
        }
    }

    function handleEnter() {
        if (isPressed) {
            pressInside = true;
        }
    }

    function handleTouchMove(event) {
        if (isPressed && rect) {
            const { x, y } = getCoordinates(event);
            pressInside = (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom);
        }
    }

    element.addEventListener('mousedown', handlePress);
    element.addEventListener('mouseenter', handleEnter);
    element.addEventListener('mouseleave', handleLeave);

    element.addEventListener('touchstart', handlePress, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
}
