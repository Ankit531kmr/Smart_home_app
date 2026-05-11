const authModeTriggers = document.querySelectorAll("[data-auth-mode]");
const authForm = document.getElementById("authForm");
const authMessage = document.getElementById("authMessage");
const authTitle = document.getElementById("authTitle");
const authSubtitle = document.getElementById("authSubtitle");
const authSubmit = document.getElementById("authSubmit");
const passwordToggle = document.getElementById("passwordToggle");
const signupOnlyFields = document.querySelectorAll(".signup-only");
const loginOnlyFields = document.querySelectorAll(".login-only");
const fullNameInput = document.getElementById("fullName");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

let authMode = "login";

function setAuthMode(nextMode) {
  authMode = nextMode;

  document.body.classList.toggle("login-mode", nextMode === "login");
  document.body.classList.toggle("signup-mode", nextMode === "signup");
  authModeTriggers.forEach((trigger) => trigger.classList.toggle("active", trigger.dataset.authMode === nextMode));
  signupOnlyFields.forEach((field) => field.classList.toggle("hidden", nextMode !== "signup"));
  loginOnlyFields.forEach((field) => field.classList.toggle("hidden", nextMode !== "login"));
  fullNameInput.required = nextMode === "signup";
  passwordInput.autocomplete = nextMode === "signup" ? "new-password" : "current-password";

  if (nextMode === "signup") {
    authTitle.textContent = "Create account!";
    authSubtitle.textContent = "Sign up to your account";
    authSubmit.querySelector(".button-text").textContent = "Sign up";
  } else {
    authTitle.textContent = "Welcome back!";
    authSubtitle.textContent = "Login to your account";
    authSubmit.querySelector(".button-text").textContent = "Login";
  }

  clearMessage();
}

function showMessage(text, type = "success") {
  authMessage.textContent = text;
  authMessage.className = `message ${type}`;
  authMessage.classList.remove("hidden");
}

function clearMessage() {
  authMessage.className = "message hidden";
  authMessage.textContent = "";
}

function setLoading(isLoading) {
  authSubmit.classList.toggle("loading", isLoading);
  authSubmit.disabled = isLoading;
  authSubmit.querySelector(".spinner").classList.toggle("hidden", !isLoading);
}

function passwordIsStrong(password) {
  return password.length >= 6;
}

async function goToDashboardIfLoggedIn() {
  const { data } = await window.supabaseClient.auth.getSession();
  if (data.session) {
    window.location.href = "dashboard.html";
  }
}

passwordToggle.addEventListener("click", () => {
  const isPasswordVisible = passwordInput.type === "text";
  passwordInput.type = isPasswordVisible ? "password" : "text";
  passwordToggle.setAttribute("aria-label", isPasswordVisible ? "Show password" : "Hide password");
  passwordToggle.querySelector("i").className = isPasswordVisible ? "fa-regular fa-eye" : "fa-regular fa-eye-slash";
});

authModeTriggers.forEach((trigger) => {
  trigger.addEventListener("click", () => setAuthMode(trigger.dataset.authMode));
});

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessage();
  setLoading(true);

  try {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      throw new Error("Please enter both email and password.");
    }

    if (!passwordIsStrong(password)) {
      throw new Error("Password should be at least 6 characters long.");
    }

    if (authMode === "signup") {
      const fullName = fullNameInput.value.trim();

      if (!fullName) {
        throw new Error("Please enter your user name.");
      }

      const { data, error } = await window.supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            user_name: fullName,
            full_name: fullName || email.split("@")[0]
          }
        }
      });

      if (error) {
        throw error;
      }

      // If email confirmation is OFF in Supabase, session is returned immediately.
      if (data?.session) {
        window.location.href = "dashboard.html";
        return;
      }

      // If email confirmation is still ON, user will not get a session yet.
      showMessage("Signup successful, but email confirmation is still enabled in Supabase. Disable it to redirect instantly.", "error");
      return;
    }

    const { error } = await window.supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw error;
    }

    window.location.href = "dashboard.html";
  } catch (error) {
    showMessage(error.message || "Something went wrong. Please try again.", "error");
  } finally {
    setLoading(false);
  }
});

window.supabaseClient.auth.onAuthStateChange((_event, session) => {
  if (session) {
    window.location.href = "dashboard.html";
  }
});

setAuthMode("login");
goToDashboardIfLoggedIn();
