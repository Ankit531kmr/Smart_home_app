const app = {
  user: null,
  session: null,
  rooms: [],
  devices: [],
  chart: null,
  realtimeChannel: null,
  activeSection: "dashboard",
  sectionTransitionTimer: null,
  search: "",
  roomFilter: "all"
};

const els = {
  pageLoader: document.getElementById("pageLoader"),
  sidebar: document.getElementById("sidebar"),
  sidebarOverlay: document.getElementById("sidebarOverlay"),
  openSidebar: document.getElementById("openSidebar"),
  closeSidebar: document.getElementById("closeSidebar"),
  pageTitle: document.getElementById("pageTitle"),
  profileMenuBtn: document.getElementById("profileMenuBtn"),
  profileMenu: document.getElementById("profileMenu"),
  menuLogoutBtn: document.getElementById("menuLogoutBtn"),
  sidebarAccountBtn: document.getElementById("sidebarAccountBtn"),
  sidebarSubmenu: document.getElementById("sidebarSubmenu"),
  sidebarLogoutBtn: document.getElementById("sidebarLogoutBtn"),
  topbarAvatar: document.getElementById("topbarAvatar"),
  settingsOwnerAvatar: document.getElementById("settingsOwnerAvatar"),
  settingsOwnerName: document.getElementById("settingsOwnerName"),
  settingsOwnerEmail: document.getElementById("settingsOwnerEmail"),
  profileOwnerName: document.getElementById("profileOwnerName"),
  profileOwnerEmail: document.getElementById("profileOwnerEmail"),
  profileRoomCount: document.getElementById("profileRoomCount"),
  profileDeviceCount: document.getElementById("profileDeviceCount"),
  profileActiveDeviceCount: document.getElementById("profileActiveDeviceCount"),
  notificationsToggle: document.getElementById("notificationsToggle"),
  themeLightBtn: document.getElementById("themeLightBtn"),
  themeDarkBtn: document.getElementById("themeDarkBtn"),
  addDeviceForm: document.getElementById("addDeviceForm"),
  addRoomForm: document.getElementById("addRoomForm"),
  deviceName: document.getElementById("deviceName"),
  deviceRoom: document.getElementById("deviceRoom"),
  deviceStatus: document.getElementById("deviceStatus"),
  roomHints: document.getElementById("roomHints"),
  roomName: document.getElementById("roomName"),
  deviceSearch: document.getElementById("deviceSearch"),
  roomFilter: document.getElementById("roomFilter"),
  deviceResetBtn: document.getElementById("deviceResetBtn"),
  dashboardDevices: document.getElementById("dashboardDevices"),
  deviceSectionGrid: document.getElementById("deviceSectionGrid"),
  deviceSectionTotal: document.getElementById("deviceSectionTotal"),
  deviceSectionRooms: document.getElementById("deviceSectionRooms"),
  deviceSectionMeta: document.getElementById("deviceSectionMeta"),
  roomsGrid: document.getElementById("roomsGrid"),
  deviceSummaryChip: document.getElementById("deviceSummaryChip"),
  statDevices: document.getElementById("statDevices"),
  statActive: document.getElementById("statActive"),
  statRooms: document.getElementById("statRooms"),
  statEnergy: document.getElementById("statEnergy"),
  energyToday: document.getElementById("energyToday"),
  energyPeak: document.getElementById("energyPeak"),
  energyEfficiency: document.getElementById("energyEfficiency"),
  energyBreakdown: document.getElementById("energyBreakdown"),
  energyCanvas: document.getElementById("energyChart")
};

function getTheme() {
  return localStorage.getItem("smarthome-theme") || "dark";
}

function getNotificationPreference() {
  return localStorage.getItem("smarthome-notifications") !== "off";
}

function getConnectionMode() {
  return localStorage.getItem("smarthome-connection") || "wifi";
}

function applyTheme() {
  document.body.classList.toggle("light", getTheme() === "light");
  syncSettingsUI();
}

function setTheme(mode) {
  localStorage.setItem("smarthome-theme", mode);
  applyTheme();
  renderEnergy();
}

function syncSettingsUI() {
  if (els.notificationsToggle) {
    els.notificationsToggle.checked = getNotificationPreference();
  }

  const currentTheme = getTheme();
  if (els.themeLightBtn) {
    els.themeLightBtn.classList.toggle("active", currentTheme === "light");
  }
  if (els.themeDarkBtn) {
    els.themeDarkBtn.classList.toggle("active", currentTheme === "dark");
  }

  document.querySelectorAll('input[name="connectionMode"]').forEach((input) => {
    input.checked = input.value === getConnectionMode();
  });
}

function setLoading(isLoading) {
  els.pageLoader.style.display = isLoading ? "grid" : "none";
}

function openSidebar() {
  if (!els.sidebar || !els.sidebarOverlay) return;
  els.sidebar.classList.add("open");
  els.sidebarOverlay.classList.add("open");
}

function closeSidebar() {
  if (!els.sidebar || !els.sidebarOverlay) return;
  els.sidebar.classList.remove("open");
  els.sidebarOverlay.classList.remove("open");
}

function toggleProfileMenu(force) {
  const shouldOpen = typeof force === "boolean" ? force : !els.profileMenu.classList.contains("open");
  els.profileMenu.classList.toggle("open", shouldOpen);
}

function toggleSidebarSubmenu(force) {
  const shouldOpen = typeof force === "boolean" ? force : !els.sidebarSubmenu.classList.contains("open");
  els.sidebarSubmenu.classList.toggle("open", shouldOpen);
  els.sidebarAccountBtn.setAttribute("aria-expanded", String(shouldOpen));
}

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  const title = document.createElement("strong");
  title.textContent = type === "success" ? "Success" : "Error";
  const body = document.createElement("p");
  body.textContent = message;
  toast.append(title, body);
  document.getElementById("toastHost").appendChild(toast);
  setTimeout(() => toast.remove(), 2600);
}

function formatName(value, fallback = "User") {
  if (!value) return fallback;
  return value
    .replace(/[._-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getDisplayName(user) {
  return user?.user_metadata?.full_name || formatName(user?.email?.split("@")[0]);
}

function getAvatarUrl(user) {
  return user?.user_metadata?.avatar_url || "";
}

function initials(name) {
  return name.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function createAvatarDataUri(name) {
  const initialsText = initials(name || "User");
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#7cf0c2"/>
          <stop offset="100%" stop-color="#68d3ff"/>
        </linearGradient>
      </defs>
      <rect width="96" height="96" rx="48" fill="url(#g)"/>
      <text x="48" y="58" text-anchor="middle" font-size="34" font-family="Outfit, Arial, sans-serif" font-weight="700" fill="#07111f">${initialsText}</text>
    </svg>
  `.trim();
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function setAvatar(img, name, url) {
  if (url) {
    img.src = url;
    img.alt = name;
    img.style.background = "none";
    img.onerror = () => {
      img.onerror = null;
      img.src = createAvatarDataUri(name);
    };
    return;
  }

  img.src = createAvatarDataUri(name);
  img.alt = name;
  img.style.background = "linear-gradient(135deg, var(--accent), var(--primary))";
}

function getRoomName(roomId) {
  const room = app.rooms.find((entry) => entry.id === roomId);
  return room ? room.name : "Unassigned";
}

function getRoomCount(roomId) {
  return app.devices.filter((device) => device.room_id === roomId).length;
}

function getActiveDevicesCount() {
  return app.devices.filter((device) => device.status).length;
}

function getFilteredDevices(list = app.devices) {
  const search = app.search.trim().toLowerCase();
  return list.filter((device) => {
    const roomName = getRoomName(device.room_id);
    const matchesSearch = !search || device.name.toLowerCase().includes(search);
    const matchesRoom = app.roomFilter === "all" || roomName === app.roomFilter;
    return matchesSearch && matchesRoom;
  });
}

function deviceIcon(name) {
  const value = name.toLowerCase();
  if (value.includes("light")) return "fa-lightbulb";
  if (value.includes("fan")) return "fa-fan";
  if (value.includes("ac") || value.includes("air")) return "fa-snowflake";
  if (value.includes("tv") || value.includes("television")) return "fa-tv";
  if (value.includes("door")) return "fa-door-closed";
  if (value.includes("camera")) return "fa-video";
  if (value.includes("plug")) return "fa-plug";
  return "fa-house";
}

function deviceType(name) {
  const value = name.toLowerCase();
  if (value.includes("light")) return "Light";
  if (value.includes("fan")) return "Fan";
  if (value.includes("thermostat")) return "Thermostat";
  if (value.includes("plug")) return "Plug";
  if (value.includes("camera")) return "Camera";
  if (value.includes("tv") || value.includes("television")) return "TV";
  if (value.includes("door")) return "Door";
  if (value.includes("ac") || value.includes("air")) return "Air Conditioner";
  return "Smart Device";
}

function formatLastActivity(device, index) {
  if (device.status) {
    const minutes = (index + 1) * 3;
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }

  if (index < 2) {
    return `${index + 1} hour${index === 0 ? "" : "s"} ago`;
  }

  return `${(index + 1) * 2} hours ago`;
}

function setButtonLoading(button, isLoading) {
  button.classList.toggle("loading", isLoading);
  button.disabled = isLoading;
  const spinner = button.querySelector(".spinner");
  if (spinner) {
    spinner.classList.toggle("hidden", !isLoading);
  }
}

function updateProfileUI() {
  const name = getDisplayName(app.user);
  const email = app.user?.email || "";
  const avatarUrl = getAvatarUrl(app.user);

  setAvatar(els.topbarAvatar, name, avatarUrl);
  if (els.settingsOwnerName) {
    els.settingsOwnerName.textContent = name;
  }
  if (els.settingsOwnerEmail) {
    els.settingsOwnerEmail.textContent = email;
  }
  if (els.settingsOwnerAvatar) {
    setAvatar(els.settingsOwnerAvatar, name, avatarUrl);
  }
  if (els.profileOwnerName) {
    els.profileOwnerName.textContent = name;
  }
  if (els.profileOwnerEmail) {
    els.profileOwnerEmail.textContent = email;
  }
}

function updateSectionTitle() {
  const titleMap = {
    dashboard: "Dashboard",
    devices: "Devices",
    rooms: "Rooms",
    energy: "Energy",
    settings: "Settings",
    profile: "Profile"
  };
  els.pageTitle.textContent = titleMap[app.activeSection] || "Dashboard";
}

function switchSection(sectionName) {
  if (app.activeSection === sectionName) {
    updateSectionTitle();
    closeSidebar();
    toggleProfileMenu(false);
    toggleSidebarSubmenu(false);
    return;
  }

  const currentSection = document.getElementById(`section-${app.activeSection}`);
  const nextSection = document.getElementById(`section-${sectionName}`);
  if (!nextSection) return;

  if (app.sectionTransitionTimer) {
    clearTimeout(app.sectionTransitionTimer);
    app.sectionTransitionTimer = null;
  }

  document.querySelectorAll(".section").forEach((section) => {
    section.classList.remove("entering", "leaving");
  });

  if (currentSection) {
    currentSection.classList.remove("active");
    currentSection.classList.add("leaving");
  }

  app.activeSection = sectionName;
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.toggle("active", link.dataset.section === sectionName);
  });
  updateSectionTitle();
  closeSidebar();
  toggleProfileMenu(false);
  toggleSidebarSubmenu(false);

  app.sectionTransitionTimer = setTimeout(() => {
    if (currentSection) {
      currentSection.classList.remove("leaving");
    }
    nextSection.classList.add("active", "entering");
    if (sectionName === "energy") {
      renderEnergy();
    }
    setTimeout(() => {
      nextSection.classList.remove("entering");
    }, 260);
  }, currentSection ? 150 : 0);
}

function renderDeviceCard(device) {
  const roomName = getRoomName(device.room_id);
  const statusText = device.status ? "ON" : "OFF";
  const statusClass = device.status ? "active" : "";
  const icon = deviceIcon(device.name);
  return `
    <article class="device-card">
      <div class="device-card-top">
        <div class="device-icon">
          <i class="fa-solid ${icon}"></i>
        </div>
        <span class="room-pill">${escapeHtml(roomName)}</span>
      </div>
      <div class="device-meta">
        <strong>${escapeHtml(device.name)}</strong>
        <span>Status: ${statusText}</span>
      </div>
      <div class="device-card-actions">
        <label class="toggle-wrap" title="Toggle device">
          <input class="toggle-input" type="checkbox" data-device-id="${device.id}" ${device.status ? "checked" : ""}>
          <span class="switch ${statusClass}"></span>
        </label>
        <button class="ghost-button danger-button" type="button" data-delete-device="${device.id}">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    </article>
  `;
}

function renderDevices() {
  const devices = getFilteredDevices();
  els.deviceSummaryChip.textContent = `${devices.length} device${devices.length === 1 ? "" : "s"}`;
  els.deviceSectionTotal.textContent = app.devices.length;
  els.deviceSectionRooms.textContent = `Across ${app.rooms.length} room${app.rooms.length === 1 ? "" : "s"}`;
  els.deviceSectionMeta.textContent = `Showing ${devices.length} of ${app.devices.length} device${app.devices.length === 1 ? "" : "s"}`;

  const cards = devices.length
    ? devices.map(renderDeviceCard).join("")
    : `<div class="room-card"><strong>No matching devices</strong><span>Try another search or room filter.</span></div>`;

  const rows = devices.length
    ? devices.map((device, index) => {
        const roomName = getRoomName(device.room_id);
        const statusText = device.status ? "Online" : "Offline";
        const statusClass = device.status ? "online" : "offline";
        const icon = deviceIcon(device.name);
        const type = deviceType(device.name);
        const lastActivity = formatLastActivity(device, index);

        return `
          <article class="device-table-row">
            <div class="device-table-cell device-device-cell" data-label="Device">
              <div class="device-row-icon">
                <i class="fa-solid ${icon}"></i>
              </div>
              <div class="device-row-meta">
                <strong>${escapeHtml(device.name)}</strong>
                <span>${escapeHtml(type)} control</span>
              </div>
            </div>
            <div class="device-table-cell" data-label="Room">${escapeHtml(roomName)}</div>
            <div class="device-table-cell" data-label="Status">
              <span class="device-status-pill ${statusClass}">${statusText}</span>
            </div>
            <div class="device-table-cell" data-label="Type">${escapeHtml(type)}</div>
            <div class="device-table-cell" data-label="Last Activity">${lastActivity}</div>
            <div class="device-table-cell device-action-cell">
              <button class="device-row-action" type="button" data-delete-device="${device.id}" aria-label="Delete ${escapeHtml(device.name)}">
                <i class="fa-solid fa-ellipsis-vertical"></i>
              </button>
            </div>
          </article>
        `;
      }).join("")
    : `
      <div class="device-empty">
        <strong>No matching devices</strong>
        <span class="device-table-meta">Try another search term or choose a different room.</span>
      </div>
    `;

  els.dashboardDevices.innerHTML = cards;
  els.deviceSectionGrid.innerHTML = rows;
}

function renderRooms() {
  const roomCards = app.rooms.length
    ? app.rooms.map((room) => {
        const roomDevices = app.devices.filter((device) => device.room_id === room.id);
        const previewList = roomDevices.slice(0, 4).map((device) => `<li>${escapeHtml(device.name)} ${device.status ? "(ON)" : "(OFF)"}</li>`).join("");
        return `
          <article class="room-card">
            <div class="room-card-head">
              <div>
                <strong>${escapeHtml(room.name)}</strong>
                <span>${roomDevices.length} device${roomDevices.length === 1 ? "" : "s"}</span>
              </div>
              <button class="ghost-button" type="button" data-view-room="${escapeHtml(room.name)}">View</button>
            </div>
            <ul>${previewList || "<li>No devices in this room yet.</li>"}</ul>
          </article>
        `;
      }).join("")
    : `<article class="room-card"><strong>No rooms yet</strong><span>Create your first room to start organizing devices.</span></article>`;

  els.roomsGrid.innerHTML = roomCards;
}

function renderFilters() {
  const currentFilter = app.roomFilter;
  const roomNames = app.rooms.map((room) => room.name);
  els.roomHints.innerHTML = roomNames.map((name) => `<option value="${escapeHtml(name)}"></option>`).join("");
  els.roomFilter.innerHTML = [
    '<option value="all">All rooms</option>',
    ...roomNames.map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`)
  ].join("");
  els.roomFilter.value = roomNames.includes(currentFilter) ? currentFilter : "all";
  app.roomFilter = els.roomFilter.value;
}

function renderStats() {
  const totalDevices = app.devices.length;
  const activeDevices = getActiveDevicesCount();
  const energyEstimate = Math.max(0.8, (activeDevices * 0.7) + (app.rooms.length * 0.4) + (totalDevices * 0.15));

  els.statDevices.textContent = totalDevices;
  els.statActive.textContent = `${activeDevices} active`;
  els.statRooms.textContent = app.rooms.length;
  els.statEnergy.textContent = `${energyEstimate.toFixed(1)} kWh`;
  els.energyToday.textContent = `${energyEstimate.toFixed(1)} kWh`;
  els.energyPeak.textContent = activeDevices >= 4 ? "8 PM" : "7 PM";
  els.energyEfficiency.textContent = `${Math.max(72, 98 - activeDevices * 2)}%`;
  if (els.profileRoomCount) {
    els.profileRoomCount.textContent = app.rooms.length;
  }
  if (els.profileDeviceCount) {
    els.profileDeviceCount.textContent = totalDevices;
  }
  if (els.profileActiveDeviceCount) {
    els.profileActiveDeviceCount.textContent = activeDevices;
  }
}

function renderEnergy() {
  const labels = app.devices.length ? app.devices.slice(0, 6).map((device) => device.name) : ["Living Room Light", "Bedroom Fan", "Kitchen AC", "Hall TV"];
  const data = labels.map((_, index) => Number((1.5 + (index * 0.35) + (app.devices.filter((device) => device.status).length * 0.2)).toFixed(1)));

  const breakdown = app.devices.length
    ? app.devices.slice(0, 6).map((device, index) => `
        <div class="breakdown-item">
          <div>
            <strong>${device.name}</strong>
            <small>${getRoomName(device.room_id)}</small>
          </div>
          <strong>${(0.4 + index * 0.2 + (device.status ? 0.8 : 0.2)).toFixed(1)} kWh</strong>
        </div>
      `).join("")
    : `<div class="breakdown-item"><strong>No device data yet</strong><small>Add a few devices to see simulated usage.</small></div>`;

  els.energyBreakdown.innerHTML = breakdown;

  if (typeof Chart === "undefined") {
    return;
  }

  const ctx = els.energyCanvas.getContext("2d");
  if (app.chart) {
    app.chart.destroy();
  }

  app.chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      datasets: [{
        label: "Energy usage",
        data: [4.8, 5.2, 4.9, 6.1, 6.4, 5.7, 5.3],
        borderColor: "rgba(104, 211, 255, 0.95)",
        backgroundColor: "rgba(104, 211, 255, 0.16)",
        tension: 0.35,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: getComputedStyle(document.body).getPropertyValue("--text").trim()
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: getComputedStyle(document.body).getPropertyValue("--muted").trim()
          },
          grid: {
            display: false
          }
        },
        y: {
          ticks: {
            color: getComputedStyle(document.body).getPropertyValue("--muted").trim()
          },
          grid: {
            color: "rgba(255,255,255,0.08)"
          }
        }
      }
    }
  });
}

async function loadData() {
  const [{ data: rooms, error: roomsError }, { data: devices, error: devicesError }] = await Promise.all([
    window.supabaseClient.from("rooms").select("*").order("created_at", { ascending: true }),
    window.supabaseClient.from("devices").select("*").order("created_at", { ascending: true })
  ]);

  if (roomsError) throw roomsError;
  if (devicesError) throw devicesError;

  app.rooms = rooms || [];
  app.devices = devices || [];

  renderFilters();
  renderStats();
  renderRooms();
  renderDevices();
  renderEnergy();
}

async function refreshData(showLoader = false) {
  try {
    if (showLoader) setLoading(true);
    await loadData();
  } catch (error) {
    showToast(error.message || "Failed to load dashboard data.", "error");
  } finally {
    if (showLoader) setLoading(false);
  }
}

async function ensureSession() {
  const { data, error } = await window.supabaseClient.auth.getSession();
  if (error) throw error;
  if (!data.session) {
    window.location.href = "index.html";
    return false;
  }

  app.session = data.session;
  app.user = data.session.user;
  updateProfileUI();
  return true;
}

async function ensureRoom(roomName) {
  const trimmed = roomName.trim();
  const existing = app.rooms.find((room) => room.name.toLowerCase() === trimmed.toLowerCase());
  if (existing) return existing;

  const { data, error } = await window.supabaseClient
    .from("rooms")
    .insert({
      user_id: app.user.id,
      name: trimmed
    })
    .select("*")
    .single();

  if (error) throw error;
  app.rooms.push(data);
  renderFilters();
  renderRooms();
  return data;
}

async function addDevice(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector("button[type='submit']");
  setButtonLoading(button, true);

  try {
    const name = els.deviceName.value.trim();
    const roomName = els.deviceRoom.value.trim();
    const status = els.deviceStatus.checked;

    if (!name || !roomName) {
      throw new Error("Please enter both device name and room name.");
    }

    const room = await ensureRoom(roomName);
    const { data, error } = await window.supabaseClient
      .from("devices")
      .insert({
        user_id: app.user.id,
        name,
        status,
        room_id: room.id
      })
      .select("*")
      .single();

    if (error) throw error;

    app.devices.push(data);
    renderStats();
    renderDevices();
    renderRooms();
    renderEnergy();
    showToast("Device added successfully.");
    form.reset();
    els.deviceRoom.value = room.name;
  } catch (error) {
    showToast(error.message || "Could not add device.", "error");
  } finally {
    setButtonLoading(button, false);
  }
}

async function addRoom(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector("button[type='submit']");
  setButtonLoading(button, true);

  try {
    const name = els.roomName.value.trim();
    if (!name) {
      throw new Error("Please enter a room name.");
    }

    const duplicate = app.rooms.some((room) => room.name.toLowerCase() === name.toLowerCase());
    if (duplicate) {
      throw new Error("That room already exists.");
    }

    const { data, error } = await window.supabaseClient
      .from("rooms")
      .insert({
        user_id: app.user.id,
        name
      })
      .select("*")
      .single();

    if (error) throw error;

    app.rooms.push(data);
    renderFilters();
    renderRooms();
    renderStats();
    renderEnergy();
    showToast("Room added successfully.");
    form.reset();
  } catch (error) {
    showToast(error.message || "Could not add room.", "error");
  } finally {
    setButtonLoading(button, false);
  }
}

async function toggleDevice(deviceId, checked) {
  const previous = app.devices.find((device) => device.id === deviceId);
  if (!previous) return;

  previous.status = checked;
  renderStats();
  renderDevices();
  renderEnergy();

  const { error } = await window.supabaseClient
    .from("devices")
    .update({ status: checked })
    .eq("id", deviceId)
    .eq("user_id", app.user.id);

  if (error) {
    previous.status = !checked;
    renderStats();
    renderDevices();
    renderEnergy();
    showToast(error.message || "Could not update device.", "error");
  } else {
    showToast("Device status updated.");
  }
}

async function deleteDevice(deviceId) {
  const target = app.devices.find((device) => device.id === deviceId);
  if (!target) return;

  const confirmDelete = window.confirm(`Delete "${target.name}"? This cannot be undone.`);
  if (!confirmDelete) return;

  const snapshot = [...app.devices];
  app.devices = app.devices.filter((device) => device.id !== deviceId);
  renderStats();
  renderDevices();
  renderRooms();
  renderEnergy();

  const { error } = await window.supabaseClient
    .from("devices")
    .delete()
    .eq("id", deviceId)
    .eq("user_id", app.user.id);

  if (error) {
    app.devices = snapshot;
    renderStats();
    renderDevices();
    renderRooms();
    renderEnergy();
    showToast(error.message || "Could not delete device.", "error");
  } else {
    showToast("Device deleted.");
  }
}

async function logout() {
  await window.supabaseClient.auth.signOut();
  window.location.href = "index.html";
}

function bindEvents() {
  if (els.openSidebar) {
    els.openSidebar.addEventListener("click", openSidebar);
  }
  if (els.closeSidebar) {
    els.closeSidebar.addEventListener("click", closeSidebar);
  }
  if (els.sidebarOverlay) {
    els.sidebarOverlay.addEventListener("click", closeSidebar);
  }
  els.sidebarAccountBtn.addEventListener("click", () => toggleSidebarSubmenu());
  els.profileMenuBtn.addEventListener("click", () => toggleProfileMenu());
  els.menuLogoutBtn.addEventListener("click", logout);
  els.sidebarLogoutBtn.addEventListener("click", logout);
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".profile-menu-wrap")) {
      toggleProfileMenu(false);
    }
    if (!event.target.closest(".sidebar-footer")) {
      toggleSidebarSubmenu(false);
    }
  });

  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      switchSection(link.dataset.section);
      toggleSidebarSubmenu(false);
    });
  });

  document.body.addEventListener("click", (event) => {
    const jumpButton = event.target.closest("[data-section-jump]");
    if (jumpButton) {
      switchSection(jumpButton.dataset.sectionJump);
    }

    const viewRoomButton = event.target.closest("[data-view-room]");
    if (viewRoomButton && els.roomsGrid.contains(viewRoomButton)) {
      app.roomFilter = viewRoomButton.dataset.viewRoom;
      els.roomFilter.value = app.roomFilter;
      switchSection("devices");
      renderDevices();
    }
  });

  els.addDeviceForm.addEventListener("submit", addDevice);
  els.addRoomForm.addEventListener("submit", addRoom);
  els.deviceSearch.addEventListener("input", (event) => {
    app.search = event.target.value;
    renderDevices();
  });
  els.roomFilter.addEventListener("change", (event) => {
    app.roomFilter = event.target.value;
    renderDevices();
  });
  els.deviceResetBtn.addEventListener("click", () => {
    app.search = "";
    app.roomFilter = "all";
    els.deviceSearch.value = "";
    els.roomFilter.value = "all";
    renderDevices();
  });
  if (els.notificationsToggle) {
    els.notificationsToggle.addEventListener("change", () => {
      localStorage.setItem("smarthome-notifications", els.notificationsToggle.checked ? "on" : "off");
    });
  }
  document.querySelectorAll('input[name="connectionMode"]').forEach((input) => {
    input.addEventListener("change", (event) => {
      localStorage.setItem("smarthome-connection", event.target.value);
      syncSettingsUI();
    });
  });
  if (els.themeLightBtn) {
    els.themeLightBtn.addEventListener("click", () => setTheme("light"));
  }
  if (els.themeDarkBtn) {
    els.themeDarkBtn.addEventListener("click", () => setTheme("dark"));
  }
  els.deviceSectionGrid.addEventListener("change", (event) => {
    const input = event.target.closest(".toggle-input");
    if (input) {
      toggleDevice(input.dataset.deviceId, input.checked);
    }
  });
  document.getElementById("dashboardDevices").addEventListener("change", (event) => {
    const input = event.target.closest(".toggle-input");
    if (input) {
      toggleDevice(input.dataset.deviceId, input.checked);
    }
  });
  document.getElementById("deviceSectionGrid").addEventListener("click", (event) => {
    const button = event.target.closest("[data-delete-device]");
    if (button) {
      deleteDevice(button.dataset.deleteDevice);
    }
  });
  document.getElementById("dashboardDevices").addEventListener("click", (event) => {
    const button = event.target.closest("[data-delete-device]");
    if (button) {
      deleteDevice(button.dataset.deleteDevice);
    }
  });
}

async function subscribeRealtime() {
  if (app.realtimeChannel) {
    await window.supabaseClient.removeChannel(app.realtimeChannel);
  }

  app.realtimeChannel = window.supabaseClient
    .channel(`smart-home-${app.user.id}`)
    .on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "rooms",
      filter: `user_id=eq.${app.user.id}`
    }, () => refreshData(false))
    .on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "devices",
      filter: `user_id=eq.${app.user.id}`
    }, () => refreshData(false))
    .subscribe();
}

async function init() {
  applyTheme();
  bindEvents();

  try {
    setLoading(true);
    const ok = await ensureSession();
    if (!ok) return;
    await refreshData(false);
    await subscribeRealtime();
    updateSectionTitle();
    showToast("Dashboard ready.");
  } catch (error) {
    showToast(error.message || "Could not initialize dashboard.", "error");
    window.location.href = "index.html";
  } finally {
    setLoading(false);
  }
}

window.supabaseClient.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_OUT" || !session) {
    window.location.href = "index.html";
    return;
  }

  app.session = session;
  app.user = session.user;
  updateProfileUI();
});

init();
