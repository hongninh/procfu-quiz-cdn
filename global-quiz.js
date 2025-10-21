/**
 * GLOBAL QUIZ ENGINE
 * Core JavaScript engine cho tất cả các quiz trên procfu.com
 * Nhúng file này trước local-quiz-*.js
 */

class QuizEngine {
    constructor(gameData) {
        this.gameData = gameData;
        this.questions = gameData.EachQuiz || [];
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.totalPoints = 0;
        this.maxPoints = gameData.main_total_max_points || 0;
        this.answers = [];
        this.quizResults = [];
        this.container = null;
        this.currentAnswer = null;
        this.currentQuestionStartTime = null;
        this.quizStartTime = null;
        this.streak = 0;
        this.cumulativeScore = 0;
    }

    init(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error('Container not found:', containerId);
            return;
        }
        this.quizStartTime = new Date();
        this.render();
    }

    render() {
        if (this.currentQuestionIndex < this.questions.length) {
            this.renderQuestion();
        } else {
            this.renderResults();
        }
    }

    renderQuestion() {
        const q = this.questions[this.currentQuestionIndex];
        const total = this.questions.length;
        const num = this.currentQuestionIndex + 1;
        this.currentQuestionStartTime = new Date();

        let qHtml = '';
        switch (q.qtype) {
            case 'mcq': qHtml = this.renderMCQ(q); break;
            case 'multi': qHtml = this.renderMulti(q); break;
            case 'image_mcq': qHtml = this.renderImageMCQ(q); break;
            case 'image_multi': qHtml = this.renderImageMulti(q); break;
            case 'hotspot': qHtml = this.renderHotspot(q); break;
            case 'multi_hotspot': qHtml = this.renderMultiHotspot(q); break;
            case 'order': qHtml = this.renderOrder(q); break;
            case 'image_pair': qHtml = this.renderImagePair(q); break;
            case 'drag_drop': qHtml = this.renderDragDrop(q); break;
        }

        this.container.innerHTML = `
            <div class="quiz-container">
                ${num === 1 ? `<div class="quiz-header">
                    <h1 class="quiz-main-title">${this.gameData.main_title}</h1>
                    <p class="quiz-description">${this.gameData.main_description}</p>
                </div>` : ''}
                <div class="quiz-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${(num / total) * 100}%"></div>
                    </div>
                    <div class="progress-text">Câu ${num} / ${total} • ${q.pmax} điểm</div>
                </div>
                <div class="question-container">
                    <span class="question-type-badge">${this.getTypeLabel(q.qtype)}</span>
                    <h2 class="question-title">${q.qtxt}</h2>
                    ${qHtml}
                </div>
            </div>
        `;
        this.attachEventListeners(q);
    }

    getTypeLabel(t) {
        const l = {
            'mcq': 'Chọn 1 đáp án',
            'multi': 'Chọn nhiều đáp án',
            'image_mcq': 'Chọn 1 hình',
            'image_multi': 'Chọn nhiều hình',
            'hotspot': 'Click điểm',
            'multi_hotspot': 'Click nhiều điểm',
            'order': 'Sắp xếp',
            'image_pair': 'Ghép cặp',
            'drag_drop': 'Kéo thả'
        };
        return l[t] || t;
    }

    renderMCQ(q) {
        return `
            ${q.image_json?.[0] ? `<img src="${q.image_json[0]}" class="question-image">` : ''}
            <div class="text-answers-container">
                ${q.opt_array.map((a, i) => `
                    <div class="text-answer-option" data-index="${i}">
                        <span class="answer-letter">${String.fromCharCode(65 + i)}</span>
                        <span class="answer-text">${a}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderMulti(q) {
        return `
            ${q.image_json?.[0] ? `<img src="${q.image_json[0]}" class="question-image">` : ''}
            <div class="text-answers-container">
                ${q.opt_array.map((a, i) => `
                    <div class="text-answer-option" data-index="${i}">
                        <span class="answer-letter">${String.fromCharCode(65 + i)}</span>
                        <span class="answer-text">${a}</span>
                        <span class="answer-checkbox">☐</span>
                    </div>
                `).join('')}
            </div>
            <button class="submit-button" id="submit-multi">Xác nhận</button>
        `;
    }

    renderImageMCQ(q) {
        return `
            <div class="image-answers-container">
                ${q.opt_array.map((a, i) => `
                    <div class="image-answer-option" data-index="${i}">
                        <img src="${a.image}" alt="${a.text}" class="image-answer-img">
                        <div class="image-answer-text">${a.text}</div>
                        <div class="image-answer-checkbox">○</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderImageMulti(q) {
        return `
            <div class="image-answers-container">
                ${q.opt_array.map((a, i) => `
                    <div class="image-answer-option" data-index="${i}">
                        <img src="${a.image}" alt="${a.text}" class="image-answer-img">
                        <div class="image-answer-text">${a.text}</div>
                        <div class="image-answer-checkbox">☐</div>
                    </div>
                `).join('')}
            </div>
            <button class="submit-button" id="submit-image-multi">Xác nhận</button>
        `;
    }

    renderHotspot(q) {
        return `
            <div class="hotspot-container">
                <div class="hotspot-instructions">📍 ${q.qtxt}</div>
                <div class="hotspot-image-wrapper">
                    <img src="${q.image_json[0]}" class="hotspot-image" id="hotspot-img">
                    <div class="hotspot-overlay" id="hotspot-overlay"></div>
                </div>
            </div>
        `;
    }

    renderMultiHotspot(q) {
        const count = q.sol_array ? q.sol_array.length : 0;
        return `
            <div class="hotspot-container">
                <div class="hotspot-instructions">
                    📍 Click vào tất cả các điểm nguy hiểm (${count} điểm)
                </div>
                <div class="hotspot-image-wrapper">
                    <img src="${q.image_json[0]}" class="hotspot-image">
                    <div class="hotspot-overlay">
                        ${q.hotspot_array.map((h, i) => `
                            <div class="hotspot-point" data-id="${h.id}" style="left: ${h.x}%; top: ${h.y}%;">${i + 1}</div>
                        `).join('')}
                    </div>
                </div>
                <button class="submit-button" id="submit-multi-hotspot">Xác nhận</button>
            </div>
        `;
    }

    renderOrder(q) {
        return `
            ${q.image_json?.[0] ? `<img src="${q.image_json[0]}" class="question-image">` : ''}
            <div class="order-container">
                <div class="order-items" id="order-items">
                    ${q.opt_array.map((item, i) => `
                        <div class="order-item" draggable="true" data-text="${item}">
                            <span class="order-number">${i + 1}</span>
                            <span class="order-text">${item}</span>
                            <span class="drag-handle">☰</span>
                        </div>
                    `).join('')}
                </div>
                <button class="submit-button" id="submit-order">Xác nhận</button>
            </div>
        `;
    }

    renderImagePair(q) {
        const safe = q.image_json.slice(0, 3);
        const danger = q.image_json.slice(3, 6);
        return `
            <div class="image-pair-container">
                <div class="pair-instructions">🔄 ${q.qtxt}</div>
                <div class="pair-columns">
                    <div class="pair-column safe">
                        <div class="pair-column-header">✓ An Toàn</div>
                        ${safe.map((img, i) => `
                            <div class="pair-item" data-group="safe" data-index="${i}">
                                <img src="${img}" class="pair-item-img">
                                <div class="pair-item-label">${i + 1}</div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="pair-column danger">
                        <div class="pair-column-header">⚠️ Nguy Hiểm</div>
                        ${danger.map((img, i) => `
                            <div class="pair-item" data-group="danger" data-index="${i}">
                                <img src="${img}" class="pair-item-img">
                                <div class="pair-item-label">${i + 4}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <button class="submit-button" id="submit-pair" disabled>Xác nhận</button>
            </div>
        `;
    }

    renderDragDrop(q) {
        return `
            <div class="drag-drop-container">
                <div class="drag-source">
                    <div class="drag-source-title">Kéo các hình vào cột phù hợp:</div>
                    <div class="draggable-items">
                        ${q.drag_items.map((item, i) => `
                            <div class="draggable-item" draggable="true" data-id="${item.id}">
                                <img src="${item.image}" class="draggable-item-img">
                                <div class="draggable-item-label">${item.label}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="drop-zones">
                    <div class="drop-zone safe" data-zone="safe">
                        <div class="drop-zone-header">✓ An Toàn</div>
                        <div class="drop-zone-items"></div>
                    </div>
                    <div class="drop-zone danger" data-zone="danger">
                        <div class="drop-zone-header">⚠️ Nguy Cơ</div>
                        <div class="drop-zone-items"></div>
                    </div>
                </div>
                <button class="submit-button" id="submit-drag-drop">Xác nhận</button>
            </div>
        `;
    }

    attachEventListeners(q) {
        switch (q.qtype) {
            case 'mcq': this.onMCQ(q); break;
            case 'multi': this.onMulti(q); break;
            case 'image_mcq': this.onImageMCQ(q); break;
            case 'image_multi': this.onImageMulti(q); break;
            case 'hotspot': this.onHotspot(q); break;
            case 'multi_hotspot': this.onMultiHotspot(q); break;
            case 'order': this.onOrder(q); break;
            case 'image_pair': this.onImagePair(q); break;
            case 'drag_drop': this.onDragDrop(q); break;
        }
    }

    onMCQ(q) {
        const opts = this.container.querySelectorAll('.text-answer-option');
        opts.forEach((opt, i) => {
            opt.onclick = () => {
                if (opt.classList.contains('disabled')) return;
                const ok = q.opt_array[i] === q.sol_array;
                opts.forEach(o => o.classList.add('disabled'));
                opt.classList.add(ok ? 'correct' : 'incorrect');
                if (!ok) opts[q.opt_array.indexOf(q.sol_array)].classList.add('correct');
                this.feedback(ok, q.pmax, q);
            };
        });
    }

    onMulti(q) {
        const opts = this.container.querySelectorAll('.text-answer-option');
        const btn = this.container.querySelector('#submit-multi');
        const sel = new Set();
        opts.forEach((opt, i) => {
            opt.onclick = () => {
                if (opt.classList.contains('disabled')) return;
                const a = q.opt_array[i];
                if (sel.has(a)) {
                    sel.delete(a);
                    opt.classList.remove('selected');
                    opt.querySelector('.answer-checkbox').textContent = '☐';
                } else {
                    sel.add(a);
                    opt.classList.add('selected');
                    opt.querySelector('.answer-checkbox').textContent = '☑️';
                }
                btn.disabled = sel.size === 0;
            };
        });
        btn.onclick = () => {
            const cor = new Set(q.sol_array);
            const ok = sel.size === cor.size && [...sel].every(i => cor.has(i));
            opts.forEach((opt, i) => {
                opt.classList.add('disabled');
                const a = q.opt_array[i];
                if (cor.has(a)) opt.classList.add('correct');
                else if (sel.has(a)) opt.classList.add('incorrect');
            });
            btn.disabled = true;
            this.feedback(ok, q.pmax, q);
        };
    }

    onImageMCQ(q) {
        const opts = this.container.querySelectorAll('.image-answer-option');
        opts.forEach((opt, i) => {
            opt.onclick = () => {
                if (opt.classList.contains('disabled')) return;
                const ok = i === q.sol_array;
                opts.forEach(o => o.classList.add('disabled'));
                opt.classList.add(ok ? 'correct' : 'incorrect');
                opt.querySelector('.image-answer-checkbox').textContent = ok ? '✓' : '✗';
                if (!ok) {
                    opts[q.sol_array].classList.add('correct');
                    opts[q.sol_array].querySelector('.image-answer-checkbox').textContent = '✓';
                }
                this.feedback(ok, q.pmax, q);
            };
        });
    }

    onImageMulti(q) {
        const opts = this.container.querySelectorAll('.image-answer-option');
        const btn = this.container.querySelector('#submit-image-multi');
        const sel = new Set();
        opts.forEach((opt, i) => {
            opt.onclick = () => {
                if (opt.classList.contains('disabled')) return;
                if (sel.has(i)) {
                    sel.delete(i);
                    opt.classList.remove('selected');
                    opt.querySelector('.image-answer-checkbox').textContent = '☐';
                } else {
                    sel.add(i);
                    opt.classList.add('selected');
                    opt.querySelector('.image-answer-checkbox').textContent = '☑️';
                }
                btn.disabled = sel.size === 0;
            };
        });
        btn.onclick = () => {
            const cor = new Set(q.sol_array);
            const ok = sel.size === cor.size && [...sel].every(i => cor.has(i));
            opts.forEach((opt, i) => {
                opt.classList.add('disabled');
                const ck = opt.querySelector('.image-answer-checkbox');
                if (cor.has(i)) { opt.classList.add('correct'); ck.textContent = '✓'; }
                else if (sel.has(i)) { opt.classList.add('incorrect'); ck.textContent = '✗'; }
            });
            btn.disabled = true;
            this.feedback(ok, q.pmax, q);
        };
    }

    onHotspot(q) {
        const overlay = this.container.querySelector('#hotspot-overlay');
        const img = this.container.querySelector('#hotspot-img');
        let clicked = false;
        overlay.onclick = (e) => {
            if (clicked) return;
            const rect = img.getBoundingClientRect();
            const x = (e.clientX - rect.left) * (img.naturalWidth / rect.width);
            const y = (e.clientY - rect.top) * (img.naturalHeight / rect.height);
            const dist = Math.hypot(x - q.sol_json.x, y - q.sol_json.y);
            const ok = dist <= q.sol_json.radius;

            const pt = document.createElement('div');
            pt.className = `hotspot-click-point ${ok ? 'correct' : 'incorrect'}`;
            pt.style.left = `${((e.clientX - rect.left) / rect.width) * 100}%`;
            pt.style.top = `${((e.clientY - rect.top) / rect.height) * 100}%`;
            pt.textContent = ok ? '✓' : '✗';
            overlay.appendChild(pt);

            if (!ok) {
                const cor = document.createElement('div');
                cor.className = 'hotspot-click-point correct';
                cor.style.left = `${(q.sol_json.x / img.naturalWidth) * 100}%`;
                cor.style.top = `${(q.sol_json.y / img.naturalHeight) * 100}%`;
                cor.textContent = '✓';
                overlay.appendChild(cor);
            }
            clicked = true;
            this.feedback(ok, q.pmax, q);
        };
    }

    onMultiHotspot(q) {
        const pts = this.container.querySelectorAll('.hotspot-point');
        const btn = this.container.querySelector('#submit-multi-hotspot');
        const sel = new Set();
        pts.forEach(pt => {
            pt.onclick = () => {
                if (pt.classList.contains('disabled')) return;
                const id = pt.dataset.id;
                if (sel.has(id)) {
                    sel.delete(id);
                    pt.classList.remove('selected');
                } else {
                    sel.add(id);
                    pt.classList.add('selected');
                }
            };
        });
        btn.onclick = () => {
            const cor = new Set(q.sol_array);
            let cnt = 0;
            pts.forEach(pt => {
                pt.classList.add('disabled');
                const id = pt.dataset.id;
                if (cor.has(id)) {
                    pt.classList.add('correct');
                    if (sel.has(id)) cnt++;
                } else if (sel.has(id)) {
                    pt.classList.add('incorrect');
                }
            });
            const ok = cnt === cor.size && sel.size === cor.size;
            btn.disabled = true;
            this.feedback(ok, q.pmax, q, `Đúng ${cnt}/${cor.size} điểm`);
        };
    }

    onOrder(q) {
        const items = this.container.querySelectorAll('.order-item');
        const btn = this.container.querySelector('#submit-order');
        let drag = null;
        items.forEach(item => {
            item.ondragstart = () => { drag = item; item.classList.add('dragging'); };
            item.ondragend = () => item.classList.remove('dragging');
            item.ondragover = (e) => {
                e.preventDefault();
                const cont = this.container.querySelector('#order-items');
                const after = this.getDragAfter(cont, e.clientY);
                if (!after) cont.appendChild(drag);
                else cont.insertBefore(drag, after);
                this.updateOrderNums();
            };
        });
        btn.onclick = () => {
            const curr = Array.from(this.container.querySelectorAll('.order-item')).map(i => i.dataset.text);
            const ok = JSON.stringify(curr) === JSON.stringify(q.sol_array);
            this.container.querySelectorAll('.order-item').forEach(i => { i.classList.add('disabled'); i.draggable = false; });
            btn.disabled = true;
            this.feedback(ok, q.pmax, q);
        };
    }

    updateOrderNums() {
        this.container.querySelectorAll('.order-item').forEach((i, idx) => {
            i.querySelector('.order-number').textContent = idx + 1;
        });
    }

    getDragAfter(cont, y) {
        const els = [...cont.querySelectorAll('.order-item:not(.dragging)')];
        return els.reduce((close, child) => {
            const box = child.getBoundingClientRect();
            const off = y - box.top - box.height / 2;
            if (off < 0 && off > close.offset) return { offset: off, element: child };
            return close;
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    onImagePair(q) {
        const items = this.container.querySelectorAll('.pair-item');
        const btn = this.container.querySelector('#submit-pair');
        let first = null;
        const pairs = [];
        items.forEach(item => {
            item.onclick = () => {
                if (item.classList.contains('matched') || item.classList.contains('disabled')) return;
                if (!first) {
                    first = item;
                    item.classList.add('selected');
                } else {
                    if (first === item) {
                        first.classList.remove('selected');
                        first = null;
                        return;
                    }
                    if (first.dataset.group !== item.dataset.group) {
                        const si = first.dataset.group === 'safe' ? parseInt(first.dataset.index) : parseInt(item.dataset.index);
                        const di = first.dataset.group === 'danger' ? parseInt(first.dataset.index) : parseInt(item.dataset.index);
                        pairs.push([si, di]);
                        first.classList.add('matched');
                        first.classList.remove('selected');
                        item.classList.add('matched');
                        first = null;
                        btn.disabled = pairs.length !== 3;
                    } else {
                        first.classList.remove('selected');
                        first = item;
                        item.classList.add('selected');
                    }
                }
            };
        });
        btn.onclick = () => {
            let cnt = 0;
            pairs.forEach(p => { if (p[0] === p[1]) cnt++; });
            const ok = cnt === 3;
            items.forEach(i => i.classList.add('disabled'));
            btn.disabled = true;
            this.feedback(ok, q.pmax, q, `Ghép đúng ${cnt}/3`);
        };
    }

    onDragDrop(q) {
        const drags = this.container.querySelectorAll('.draggable-item');
        const zones = this.container.querySelectorAll('.drop-zone');
        const btn = this.container.querySelector('#submit-drag-drop');
        const place = {};

        drags.forEach(d => {
            d.ondragstart = (e) => {
                if (d.classList.contains('placed')) return;
                d.classList.add('dragging');
                e.dataTransfer.setData('id', d.dataset.id);
            };
            d.ondragend = () => d.classList.remove('dragging');
        });

        zones.forEach(z => {
            z.ondragover = (e) => { e.preventDefault(); z.classList.add('drag-over'); };
            z.ondragleave = () => z.classList.remove('drag-over');
            z.ondrop = (e) => {
                e.preventDefault();
                z.classList.remove('drag-over');
                const id = e.dataTransfer.getData('id');
                const d = this.container.querySelector(`.draggable-item[data-id="${id}"]`);
                if (!d || d.classList.contains('placed')) return;

                const zType = z.dataset.zone;
                const zItems = z.querySelector('.drop-zone-items');
                const clone = d.cloneNode(true);
                clone.classList.add('dropped-item');
                clone.removeAttribute('draggable');

                const rmBtn = document.createElement('button');
                rmBtn.className = 'remove-item';
                rmBtn.innerHTML = '×';
                rmBtn.onclick = () => {
                    clone.remove();
                    d.classList.remove('placed');
                    delete place[id];
                    btn.disabled = Object.keys(place).length !== q.drag_items.length;
                };
                clone.appendChild(rmBtn);
                zItems.appendChild(clone);
                d.classList.add('placed');
                place[id] = zType;
                btn.disabled = Object.keys(place).length !== q.drag_items.length;
            };
        });

        btn.onclick = () => {
            let cnt = 0;
            q.drag_items.forEach(item => {
                if (place[item.id] === item.correct_zone) cnt++;
            });
            const ok = cnt === q.drag_items.length;
            btn.disabled = true;
            drags.forEach(d => d.draggable = false);
            this.feedback(ok, q.pmax, q, `Xếp đúng ${cnt}/${q.drag_items.length}`);
        };
    }

    feedback(ok, pts, q, msg = '') {
        const endTime = new Date();
        const playTime = endTime - this.currentQuestionStartTime;
        const timeRemaining = (q.tmax || 0) - playTime;

        if (ok) {
            this.score++;
            this.streak++;
        } else {
            this.streak = 0;
        }
        this.totalPoints += pts;
        this.cumulativeScore += pts;

        this.quizResults.push({
            "qn": q.qn,
            "lq": q.lq,
            "qid": q.qid,
            "ts_start": this.currentQuestionStartTime.toISOString(),
            "ts_end": endTime.toISOString(),
            "pt": playTime,
            "ps": pts,
            "ans": this.currentAnswer ? (this.currentAnswer.selected || this.currentAnswer.order || []) : [],
            "cor": ok,
            "skip": false,
            "trem": Math.max(0, timeRemaining),
            "hint": false,
            "pen": ok ? 0 : (q.penalty_points || 0),
            "cum": this.cumulativeScore,
            "streak": this.streak,
            "sol": q.sol_array || q.sol_json || [],
            "expl": q.expl || "",
            "show_sol": q.display_correct_answer === "y"
        });

        const m = msg || (ok ? 'Chính xác! ✓' : 'Chưa chính xác! ✗');
        const html = `
            <div class="feedback-message ${ok ? 'feedback-correct' : 'feedback-incorrect'}">
                <span class="feedback-icon">${ok ? '✓' : '✗'}</span>
                <span>${m} (+${pts} điểm)</span>
            </div>
            ${q.expl ? `<div class="explanation"><strong>💡</strong> ${q.expl}</div>` : ''}
        `;
        const qc = this.container.querySelector('.question-container');
        qc.insertAdjacentHTML('beforeend', html);
        const next = document.createElement('button');
        next.className = 'next-button';
        next.textContent = this.currentQuestionIndex < this.questions.length - 1 ? 'Câu tiếp theo →' : 'Xem kết quả';
        next.onclick = () => this.nextQuestion();
        qc.appendChild(next);
    }

    nextQuestion() {
        this.currentQuestionIndex++;
        this.render();
    }

    renderResults() {
        const t = this.questions.length;
        const p = Math.round((this.score / t) * 100);
        const pass = p >= (this.gameData.main_pass_threshold_percent || 70);
        const quizEndTime = new Date();
        const totalTime = quizEndTime - this.quizStartTime;

        const skippedCount = this.quizResults.filter(r => r.skip).length;
        const avgTime = Math.round(totalTime / t);

        const finalOutput = {
            "main_game_id": this.gameData.main_game_id,
            "main_game_version": this.gameData.main_game_version,
            "main_author": this.gameData.main_author,
            "main_language": this.gameData.main_language,
            "main_total_questions": t,
            "main_total_points": this.maxPoints,
            "player_info": {
                "uid": "user_" + Math.random().toString(36).substr(2, 9),
                "sid": "session_" + Date.now(),
                "att": 1,
                "ua": navigator.userAgent,
                "ip": "hidden"
            },
            "quiz_results": this.quizResults,
            "summary": {
                "total_score": this.totalPoints,
                "max_score": this.maxPoints,
                "correct_count": this.score,
                "wrong_count": t - this.score - skippedCount,
                "skipped_count": skippedCount,
                "avg_time_per_question_ms": avgTime,
                "total_time_ms": totalTime,
                "completion_rate_percent": 100,
                "pass_status": pass ? "passed" : "failed",
                "percentage": p
            }
        };

        console.log("📊 KẾT QUẢ QUIZ:", JSON.stringify(finalOutput, null, 2));
        localStorage.setItem('quiz_result_latest', JSON.stringify(finalOutput));

        this.container.innerHTML = `
            <div class="quiz-container results-container">
                <div class="results-header"><h2>🎯 Kết quả</h2></div>
                <div class="results-score">
                    <div class="score-circle ${pass ? 'passed' : 'failed'}">
                        <svg viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="45" class="score-circle-bg"></circle>
                            <circle cx="50" cy="50" r="45" class="score-circle-fill" style="stroke-dasharray: ${p * 2.827}, 282.7"></circle>
                        </svg>
                        <div class="score-text">
                            <div class="score-percentage">${p}%</div>
                            <div class="score-fraction">${this.score}/${t} câu</div>
                        </div>
                    </div>
                </div>
                <div class="results-message ${pass ? 'message-passed' : 'message-failed'}">
                    ${pass ? '🎉 Xuất sắc! Bạn đã đạt!' : '😔 Hãy thử lại nhé!'}
                </div>
                <div style="text-align: center; padding: 15px; background: #f8f9fa; border-radius: 10px; margin-bottom: 20px;">
                    <div><strong>Tổng điểm:</strong> ${this.totalPoints}/${this.maxPoints}</div>
                    <div style="font-size: 13px; color: #666; margin-top: 8px;">
                        Thời gian: ${Math.floor(totalTime / 1000)}s | Trung bình: ${Math.floor(avgTime / 1000)}s/câu
                    </div>
                </div>
                <button class="submit-button" onclick="window.QuizUtils.downloadResults()" style="background: #28a745; margin-bottom: 10px;">
                    📥 Tải kết quả JSON
                </button>
                <button class="submit-button" onclick="window.QuizUtils.copyResults()" style="background: #17a2b8; margin-bottom: 10px;">
                    📋 Copy kết quả
                </button>
                <button class="retry-button" onclick="location.reload()">🔄 Làm lại</button>
            </div>
        `;

        window.quizFinalOutput = finalOutput;
    }
}

// Utility functions
window.QuizUtils = {
    downloadResults: function() {
        if (!window.quizFinalOutput) {
            alert('Chưa có kết quả!');
            return;
        }
        const dataStr = JSON.stringify(window.quizFinalOutput, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `quiz_result_${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(url);
        alert('✅ Đã tải file JSON!');
    },

    copyResults: function() {
        if (!window.quizFinalOutput) {
            alert('Chưa có kết quả!');
            return;
        }
        const dataStr = JSON.stringify(window.quizFinalOutput, null, 2);
        navigator.clipboard.writeText(dataStr).then(() => {
            alert('✅ Đã copy kết quả JSON vào clipboard!');
        }).catch(err => {
            console.error('Copy failed:', err);
            const textarea = document.createElement('textarea');
            textarea.value = dataStr;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            alert('✅ Đã copy kết quả!');
        });
    }
};
