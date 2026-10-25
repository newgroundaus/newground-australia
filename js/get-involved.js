(function () {
    var form = document.getElementById("involve-form");
    if (!form) {
        return;
    }

    var config = window.NGA_CONFIG || {};
    var startedAt = Date.now();
    var MIN_MS = 2500;
    var WINDOW_MS = 10 * 60 * 1000;
    var MAX_IN_WINDOW = 3;
    var LIMIT_KEY = "nga-enquiry-times";
    var MESSAGE_MAX = 2000;

    var statusEl = document.getElementById("form-status");
    var submitBtn = document.getElementById("involve-submit");
    var orgField = document.getElementById("org-field");
    var orgInput = document.getElementById("org");
    var messageInput = document.getElementById("message");
    var messageCount = document.getElementById("message-count");
    var turnstileBox = document.getElementById("turnstile-widget");
    var turnstileOn = config.turnstileEnabled === true && !!config.turnstileSiteKey;

    var ORG_ROLES = {
        "Church or ministry": true,
        "Organisation or business": true
    };

    function cleanLine(value, max) {
        return String(value || "")
            .replace(/[\u0000-\u001F\u007F]/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, max);
    }

    function cleanMessage(value) {
        return String(value || "")
            .replace(/\r\n/g, "\n")
            .replace(/\r/g, "\n")
            .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
            .trim()
            .slice(0, MESSAGE_MAX);
    }

    function selectedRole() {
        var checked = form.querySelector('input[name="role"]:checked');
        return checked ? checked.value : "";
    }

    function selectedHelp() {
        return Array.prototype.map.call(
            form.querySelectorAll('input[name="help"]:checked'),
            function (box) { return box.value; }
        );
    }

    function syncOrg() {
        var show = !!ORG_ROLES[selectedRole()];
        orgField.hidden = !show;
        orgInput.disabled = !show;
        if (!show) {
            clearField(orgField);
        }
    }

    function updateCount() {
        if (!messageCount || !messageInput) {
            return;
        }
        messageCount.textContent = messageInput.value.length + " / " + MESSAGE_MAX;
    }

    function clearField(field) {
        field.classList.remove("is-invalid");
        var error = field.querySelector(".field-error");
        if (error) {
            error.textContent = "";
            error.hidden = true;
        }
        var control = field.querySelector("input, select, textarea");
        if (control) {
            control.removeAttribute("aria-invalid");
            control.removeAttribute("aria-describedby");
        }
    }

    function setFieldError(field, message) {
        field.classList.add("is-invalid");
        var error = field.querySelector(".field-error");
        if (error) {
            error.textContent = message;
            error.hidden = false;
        }
        var control = field.querySelector("input, select, textarea");
        if (control && error) {
            control.setAttribute("aria-invalid", "true");
            control.setAttribute("aria-describedby", error.id);
        }
        return control;
    }

    function clearStatus() {
        statusEl.hidden = true;
        statusEl.className = "form-status";
        statusEl.replaceChildren();
    }

    function showStatus(kind, nodes) {
        statusEl.hidden = false;
        statusEl.className = "form-status is-" + kind;
        statusEl.replaceChildren();
        nodes.forEach(function (node) {
            statusEl.appendChild(node);
        });
        statusEl.focus();
    }

    function paragraph(text) {
        var p = document.createElement("p");
        p.textContent = text;
        return p;
    }

    function dataFromForm() {
        return {
            role: cleanLine(selectedRole(), 80),
            help: selectedHelp().map(function (item) { return cleanLine(item, 80); }),
            name: cleanLine(document.getElementById("name").value, 120),
            email: cleanLine(form.email.value, 254),
            phone: cleanLine(form.phone.value, 30),
            org: orgInput.disabled ? "" : cleanLine(orgInput.value, 160),
            place: cleanLine(form.place.value, 120),
            state: cleanLine(form.state.value, 40),
            message: cleanMessage(messageInput.value)
        };
    }

    function mailtoHref(data) {
        var subject = "[NGA Get Involved] " + data.role + ": " + data.name;
        var body = [
            "I am a: " + data.role,
            "I'd like to: " + (data.help.join(", ") || "Not provided"),
            "Full name: " + data.name,
            "Email: " + data.email,
            "Phone: " + (data.phone || "Not provided"),
            "Church or organisation: " + (data.org || "Not provided"),
            "Suburb or city: " + (data.place || "Not provided"),
            "State: " + (data.state || "Not provided"),
            "",
            data.message
        ].join("\n");
        return "mailto:newgroundaus@gmail.com?subject=" + encodeURIComponent(subject.slice(0, 150))
            + "&body=" + encodeURIComponent(body);
    }

    function showFailure(data, detail) {
        var link = document.createElement("a");
        link.href = mailtoHref(data);
        link.textContent = "newgroundaus@gmail.com";
        var second = document.createElement("p");
        second.appendChild(document.createTextNode("Email us at "));
        second.appendChild(link);
        second.appendChild(document.createTextNode(" and we will still receive your enquiry."));
        var nodes = [paragraph("We couldn't send your enquiry just now.")];
        if (detail) {
            nodes.push(paragraph(detail));
        }
        nodes.push(second);
        showStatus("error", nodes);
    }

    function showSuccess() {
        form.hidden = true;
        showStatus("success", [paragraph("Thank you. We'll be in touch.")]);
    }

    function validate(data) {
        var firstControl = null;
        form.querySelectorAll(".field").forEach(clearField);

        function mark(fieldId, message) {
            var control = setFieldError(document.getElementById(fieldId), message);
            if (!firstControl) {
                firstControl = control;
            }
        }

        if (!data.role) {
            mark("role-field", "Choose the option that best describes you.");
        }
        if (!data.help.length) {
            mark("help-field", "Choose at least one way you’d like to help.");
        }
        if (data.name.length < 2) {
            mark("name-field", "Enter your full name.");
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            mark("email-field", "Enter a valid email address.");
        }
        if (data.phone && !/^[0-9+().\-\s]{6,30}$/.test(data.phone)) {
            mark("phone-field", "Enter a phone number using digits and the usual symbols, or leave it blank.");
        }
        if (data.message.length < 10) {
            mark("message-field", "Tell us a little about how you’d like to be involved (at least a short sentence).");
        }
        if (!form.consent.checked) {
            mark("consent-field", "Please confirm we can contact you about this enquiry.");
        }
        return firstControl;
    }

    function tooManyRecently() {
        var now = Date.now();
        var times = [];
        try {
            times = JSON.parse(localStorage.getItem(LIMIT_KEY) || "[]");
            if (!Array.isArray(times)) {
                times = [];
            }
            times = times.filter(function (stamp) {
                return typeof stamp === "number" && now - stamp < WINDOW_MS;
            });
            if (times.length >= MAX_IN_WINDOW) {
                localStorage.setItem(LIMIT_KEY, JSON.stringify(times));
                return true;
            }
            times.push(now);
            localStorage.setItem(LIMIT_KEY, JSON.stringify(times));
            return false;
        } catch (error) {
            return false;
        }
    }

    function turnstileToken() {
        var input = form.querySelector('[name="cf-turnstile-response"]');
        return input ? cleanLine(input.value, 2048) : "";
    }

    function loadTurnstile() {
        if (!turnstileOn || !turnstileBox) {
            return;
        }
        turnstileBox.hidden = false;
        if (window.turnstile) {
            return;
        }
        var script = document.createElement("script");
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.onload = function () {
            if (!window.turnstile) {
                return;
            }
            window.turnstile.render(turnstileBox, {
                sitekey: config.turnstileSiteKey,
                theme: "light"
            });
        };
        document.head.appendChild(script);
    }

    form.querySelectorAll('input[name="role"]').forEach(function (radio) {
        radio.addEventListener("change", syncOrg);
    });

    document.querySelectorAll(".help-card").forEach(function (card) {
        card.addEventListener("click", function () {
            var role = card.getAttribute("data-role");
            var help = card.getAttribute("data-help");
            if (role) {
                form.querySelectorAll('input[name="role"]').forEach(function (radio) {
                    if (radio.value === role) {
                        radio.checked = true;
                    }
                });
                syncOrg();
            }
            if (help) {
                form.querySelectorAll('input[name="help"]').forEach(function (box) {
                    if (box.value === help) {
                        box.checked = true;
                    }
                });
            }
            var name = document.getElementById("name");
            if (name) {
                name.focus();
            }
        });
    });

    if (messageInput) {
        messageInput.addEventListener("input", updateCount);
        updateCount();
    }

    syncOrg();
    loadTurnstile();

    form.addEventListener("submit", function (event) {
        event.preventDefault();
        clearStatus();

        var honeypot = form.querySelector('input[name="botcheck"]');
        if (honeypot && honeypot.value) {
            showSuccess();
            return;
        }

        var data = dataFromForm();
        var firstInvalid = validate(data);
        if (firstInvalid) {
            firstInvalid.focus();
            return;
        }

        if (Date.now() - startedAt < MIN_MS) {
            showStatus("error", [paragraph("Please wait a moment and try again.")]);
            return;
        }

        if (turnstileOn && !turnstileToken()) {
            showStatus("error", [paragraph("Please complete the spam check and try again.")]);
            return;
        }

        if (tooManyRecently()) {
            showStatus("error", [paragraph("You’ve sent a few enquiries in a short time. Please wait a little while, or email newgroundaus@gmail.com.")]);
            return;
        }

        if (typeof window.NGA_sendForm !== "function") {
            showFailure(data);
            return;
        }

        var subject = ("[NGA Get Involved] " + data.role + ": " + data.name).slice(0, 150);
        var payload = {
            _form: "contact",
            _subject: subject,
            _replyto: data.email,
            email: data.email,
            name: data.name,
            role: data.role,
            help: data.help.join(", "),
            phone: data.phone || "Not provided",
            org: data.org || "Not provided",
            place: data.place || "Not provided",
            state: data.state || "Not provided",
            message: data.message
        };

        submitBtn.disabled = true;
        submitBtn.textContent = "Sending…";
        form.setAttribute("aria-busy", "true");

        window.NGA_sendForm(payload).then(function (result) {
            if (result.ok) {
                showSuccess();
                return;
            }
            showFailure(data, result.message);
        }).finally(function () {
            form.removeAttribute("aria-busy");
            if (!form.hidden) {
                submitBtn.disabled = false;
                submitBtn.textContent = "Send enquiry";
            }
        });
    });
})();
