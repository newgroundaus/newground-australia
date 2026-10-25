(function () {
    var form = document.getElementById("prayer-form");
    if (!form) {
        return;
    }

    var config = window.NGA_CONFIG || {};
    var startedAt = Date.now();
    var MIN_MS = 2500;
    var WINDOW_MS = 10 * 60 * 1000;
    var MAX_IN_WINDOW = 3;
    var LIMIT_KEY = "nga-prayer-times";
    var MESSAGE_MAX = 2000;

    var statusEl = document.getElementById("form-status");
    var submitBtn = document.getElementById("prayer-submit");
    var messageInput = document.getElementById("message");
    var messageCount = document.getElementById("message-count");
    var turnstileBox = document.getElementById("turnstile-widget");
    var turnstileOn = config.turnstileEnabled === true && !!config.turnstileSiteKey;

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

    function clearField(field) {
        field.classList.remove("is-invalid");
        var error = field.querySelector(".field-error");
        if (error) {
            error.textContent = "";
            error.hidden = true;
        }
        var control = field.querySelector("input, textarea");
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
        var control = field.querySelector("input, textarea");
        if (control && error) {
            control.setAttribute("aria-invalid", "true");
            control.setAttribute("aria-describedby", error.id);
        }
        return control;
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
            name: cleanLine(document.getElementById("name").value, 120),
            email: cleanLine(form.email.value, 254),
            phone: cleanLine(form.phone.value, 30),
            message: cleanMessage(messageInput.value)
        };
    }

    function mailtoHref(data) {
        var subject = "[NGA Prayer Request] " + data.name;
        var body = [
            "Full name: " + data.name,
            "Email: " + data.email,
            "Phone: " + data.phone,
            "",
            "Prayer request:",
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
        second.appendChild(document.createTextNode(" and we will still receive your request."));
        var nodes = [paragraph("We couldn't send your prayer request just now.")];
        if (detail) {
            nodes.push(paragraph(detail));
        }
        nodes.push(second);
        showStatus("error", nodes);
    }

    function showSuccess() {
        form.hidden = true;
        showStatus("success", [paragraph("Thank you. We'll be praying for you.")]);
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

        if (data.name.length < 2) {
            mark("name-field", "Enter your full name.");
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            mark("email-field", "Enter a valid email address.");
        }
        if (!/^[0-9+().\-\s]{6,30}$/.test(data.phone)) {
            mark("phone-field", "Enter a phone number so we can get in touch.");
        }
        if (data.message.length < 10) {
            mark("message-field", "Tell us what you would like us to pray for.");
        }
        if (!form.consent.checked) {
            mark("consent-field", "Please confirm we can contact you about this prayer request.");
        }
        return firstControl;
    }

    function tooManyRecently() {
        var now = Date.now();
        try {
            var times = JSON.parse(localStorage.getItem(LIMIT_KEY) || "[]");
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

    if (messageInput) {
        messageInput.addEventListener("input", function () {
            if (messageCount) {
                messageCount.textContent = messageInput.value.length + " / " + MESSAGE_MAX;
            }
        });
        if (messageCount) {
            messageCount.textContent = "0 / " + MESSAGE_MAX;
        }
    }

    loadTurnstile();

    form.addEventListener("submit", function (event) {
        event.preventDefault();
        statusEl.hidden = true;
        statusEl.replaceChildren();

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
            showStatus("error", [paragraph("You've sent a few requests in a short time. Please wait a little while, or email newgroundaus@gmail.com.")]);
            return;
        }

        if (typeof window.NGA_sendForm !== "function") {
            showFailure(data);
            return;
        }

        var subject = ("[NGA Prayer Request] " + data.name).slice(0, 150);
        var payload = {
            _form: "prayer",
            _subject: subject,
            _replyto: data.email,
            email: data.email,
            name: data.name,
            phone: data.phone,
            message: data.message
        };

        submitBtn.disabled = true;
        submitBtn.textContent = "Sending...";
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
                submitBtn.textContent = "Send prayer request";
            }
        });
    });
})();
