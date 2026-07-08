(function () {
  "use strict";

  /* ---------------- Config ---------------- */
  var OPEN_HOUR = 8,
    CLOSE_HOUR = 23;
  var ADMIN_USER = "admin",
    ADMIN_PASS = "admin123";
  var BOOKINGS_KEY = "golfutsal_bookings_v1";
  var ADMIN_SESSION_KEY = "golfutsal_admin_session_v1";
  var USERS_KEY = "golfutsal_users_v1";
  var CUSTOMER_SESSION_KEY = "golfutsal_customer_session_v1";

  var HOURS = [];
  for (var h = OPEN_HOUR; h < CLOSE_HOUR; h++) HOURS.push(h);

  function pad(n) {
    return n < 10 ? "0" + n : "" + n;
  }
  function hourLabel(h) {
    return pad(h) + ":00";
  }
  function fmtDate(d) {
    return (
      d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate())
    );
  }
  function fmtDateLabelShort(dateStr) {
    var d = new Date(dateStr + "T00:00:00");
    var days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    return { dow: days[d.getDay()], num: d.getDate() };
  }
  function fmtDateFull(dateStr) {
    var d = new Date(dateStr + "T00:00:00");
    var days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    var months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Mei",
      "Jun",
      "Jul",
      "Agu",
      "Sep",
      "Okt",
      "Nov",
      "Des",
    ];
    return (
      days[d.getDay()] +
      ", " +
      d.getDate() +
      " " +
      months[d.getMonth()] +
      " " +
      d.getFullYear()
    );
  }
  function uid(prefix) {
    return (
      (prefix || "id") +
      "_" +
      Date.now().toString(36) +
      "_" +
      Math.random().toString(36).slice(2, 7)
    );
  }
  function escapeHtml(str) {
    var d = document.createElement("div");
    d.textContent = str == null ? "" : str;
    return d.innerHTML;
  }
  function showNotice(id, type, msg) {
    var el = document.getElementById(id);
    el.className = "notice " + type;
    el.textContent = msg;
    el.style.display = "block";
    setTimeout(function () {
      el.style.display = "none";
    }, 5000);
  }

  /* ---------------- Bookings storage ---------------- */
  function getBookings() {
    try {
      return JSON.parse(localStorage.getItem(BOOKINGS_KEY)) || [];
    } catch (e) {
      return [];
    }
  }
  function saveBookings(list) {
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(list));
  }

  /* ---------------- Users (customer accounts) storage ---------------- */
  function getUsers() {
    try {
      return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
    } catch (e) {
      return [];
    }
  }
  function saveUsers(list) {
    localStorage.setItem(USERS_KEY, JSON.stringify(list));
  }
  function findUserByPhone(phone) {
    return getUsers().find(function (u) {
      return u.phone === phone;
    });
  }
  function getCurrentCustomer() {
    var id = sessionStorage.getItem(CUSTOMER_SESSION_KEY);
    if (!id) return null;
    return (
      getUsers().find(function (u) {
        return u.id === id;
      }) || null
    );
  }
  function customerLogin(id) {
    sessionStorage.setItem(CUSTOMER_SESSION_KEY, id);
  }
  function customerLogout() {
    sessionStorage.removeItem(CUSTOMER_SESSION_KEY);
  }
  function isAdminLoggedIn() {
    return sessionStorage.getItem(ADMIN_SESSION_KEY) === "1";
  }

  /* ---------------- Seed demo data (first run only) ---------------- */
  (function seed() {
    if (!localStorage.getItem(BOOKINGS_KEY)) {
      var today = fmtDate(new Date());
      saveBookings([
        {
          id: uid("bk"),
          name: "Rizky Ramadhan",
          phone: "081211112222",
          date: today,
          startHour: 19,
          duration: 1,
          notes: "",
          proof: null,
          status: "approved",
          createdAt: Date.now() - 100000,
        },
        {
          id: uid("bk"),
          name: "Tim Elang FC",
          phone: "081233334444",
          date: today,
          startHour: 20,
          duration: 2,
          notes: "Latihan rutin",
          proof: null,
          status: "pending",
          createdAt: Date.now() - 50000,
        },
      ]);
    }
    if (!localStorage.getItem(USERS_KEY)) {
      saveUsers([
        {
          id: uid("usr"),
          name: "Rizky Ramadhan",
          phone: "081211112222",
          password: "rizky123",
        },
      ]);
    }
  })();

  /* ---------------- Slot availability helpers ---------------- */
  function slotStatus(dateStr, hour, bookings) {
    bookings = bookings || getBookings();
    var status = "open";
    for (var i = 0; i < bookings.length; i++) {
      var b = bookings[i];
      if (b.date !== dateStr) continue;
      if (b.status === "rejected") continue;
      var end = b.startHour + parseInt(b.duration, 10);
      if (hour >= b.startHour && hour < end) {
        if (b.status === "approved") return "booked";
        if (b.status === "pending") status = "pending";
      }
    }
    return status;
  }
  function rangeIsFree(dateStr, startHour, duration, bookings, excludeId) {
    bookings = bookings || getBookings();
    var endHour = startHour + duration;
    for (var i = 0; i < bookings.length; i++) {
      var b = bookings[i];
      if (excludeId && b.id === excludeId) continue;
      if (b.date !== dateStr || b.status === "rejected") continue;
      var bEnd = b.startHour + parseInt(b.duration, 10);
      if (startHour < bEnd && endHour > b.startHour) return false;
    }
    return true;
  }

  /* ================= STEP 1: SCHEDULE ================= */
  var selectedDate = fmtDate(new Date());
  var selectedHour = null;

  function buildDatePicker() {
    var wrap = document.getElementById("datePicker");
    wrap.innerHTML = "";
    var today = new Date();
    for (var i = 0; i < 7; i++) {
      var d = new Date(today);
      d.setDate(today.getDate() + i);
      var ds = fmtDate(d);
      var lbl = fmtDateLabelShort(ds);
      var chip = document.createElement("div");
      chip.className = "date-chip" + (ds === selectedDate ? " active" : "");
      chip.innerHTML =
        '<div class="d">' +
        lbl.dow +
        '</div><div class="n">' +
        lbl.num +
        "</div>";
      chip.addEventListener(
        "click",
        (function (dsClosure) {
          return function () {
            selectedDate = dsClosure;
            selectedHour = null;
            buildDatePicker();
            renderSlotGrid();
            updateSelectionBar();
          };
        })(ds),
      );
      wrap.appendChild(chip);
    }
  }

  function renderSlotGrid() {
    var grid = document.getElementById("slotGrid");
    grid.innerHTML = "";
    var bookings = getBookings();
    var openCount = 0;
    HOURS.forEach(function (h) {
      var st = slotStatus(selectedDate, h, bookings);
      if (st === "open") openCount++;
      var el = document.createElement("div");
      el.className = "slot " + st + (selectedHour === h ? " selected" : "");
      var label =
        st === "open" ? "Kosong" : st === "pending" ? "Menunggu" : "Terisi";
      el.innerHTML =
        '<span class="t">' +
        hourLabel(h) +
        '</span><span class="s">' +
        label +
        "</span>";
      if (st === "open") {
        el.style.cursor = "pointer";
        el.title = "Klik untuk pilih jam ini";
        el.addEventListener(
          "click",
          (function (hh) {
            return function () {
              selectedHour = hh;
              renderSlotGrid();
              updateSelectionBar();
            };
          })(h),
        );
      }
      grid.appendChild(el);
    });
    if (selectedDate === fmtDate(new Date())) {
      document.getElementById("statOpenToday").textContent = openCount;
    }
  }

  function updateSelectionBar() {
    var info = document.getElementById("selectionInfo");
    var btn = document.getElementById("goToFormBtn");
    if (selectedHour === null) {
      info.innerHTML = "Belum ada jam yang dipilih.";
      btn.disabled = true;
    } else {
      info.innerHTML =
        "Jadwal dipilih: <b>" +
        fmtDateFull(selectedDate) +
        "</b> pukul <b>" +
        hourLabel(selectedHour) +
        "</b>";
      btn.disabled = false;
    }
  }

  document.getElementById("goToFormBtn").addEventListener("click", function () {
    if (selectedHour === null) return;
    switchView("booking");
  });

  function populateHourSelect(selectEl, dateStr, preselectHour) {
    var bookings = getBookings();
    selectEl.innerHTML = "";
    HOURS.forEach(function (h) {
      var st = slotStatus(dateStr, h, bookings);
      var opt = document.createElement("option");
      opt.value = h;
      opt.textContent =
        hourLabel(h) + (st !== "open" ? " (tidak tersedia)" : "");
      if (st !== "open") opt.disabled = true;
      selectEl.appendChild(opt);
    });
    if (preselectHour !== undefined && preselectHour !== null) {
      var target = selectEl.querySelector(
        'option[value="' + preselectHour + '"]',
      );
      if (target && !target.disabled) selectEl.value = preselectHour;
    }
  }

  /* ================= TAB / VIEW SWITCHING ================= */
  function switchView(name) {
    document.querySelectorAll(".tab-btn").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-view") === name);
    });
    document.querySelectorAll(".view").forEach(function (v) {
      v.classList.remove("active");
    });
    document.getElementById("view-" + name).classList.add("active");
    if (name === "booking") refreshBookingView();
    if (name === "admin") refreshAdminEntry();
  }
  document.querySelectorAll(".tab-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      switchView(this.getAttribute("data-view"));
    });
  });

  /* ================= ACCOUNT CHIP (topbar) ================= */
  function renderAccountChip() {
    var chip = document.getElementById("accountChip");
    var user = getCurrentCustomer();
    if (user) {
      var initial = user.name.trim().charAt(0).toUpperCase();
      chip.innerHTML =
        '<div class="avatar">' +
        initial +
        "</div>" +
        "<span>Halo, " +
        escapeHtml(user.name.split(" ")[0]) +
        "</span>" +
        '<button type="button" class="linklike" id="chipLogoutBtn">Keluar</button>';
      document
        .getElementById("chipLogoutBtn")
        .addEventListener("click", function () {
          customerLogout();
          renderAccountChip();
          refreshBookingView();
        });
    } else {
      chip.innerHTML =
        '<button type="button" class="btn-account" id="chipLoginBtn">Masuk Pelanggan</button>';
      document
        .getElementById("chipLoginBtn")
        .addEventListener("click", function () {
          switchView("booking");
        });
    }
  }

  /* ================= STEP 2: LOGIN / REGISTER / BOOKING FORM ================= */
  document
    .getElementById("switchToLogin")
    .addEventListener("click", function () {
      this.classList.add("active");
      document.getElementById("switchToRegister").classList.remove("active");
      document.getElementById("loginForm").classList.add("active");
      document.getElementById("registerForm").classList.remove("active");
    });
  document
    .getElementById("switchToRegister")
    .addEventListener("click", function () {
      this.classList.add("active");
      document.getElementById("switchToLogin").classList.remove("active");
      document.getElementById("registerForm").classList.add("active");
      document.getElementById("loginForm").classList.remove("active");
    });

  document.getElementById("loginForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var phone = document.getElementById("loginPhone").value.trim();
    var pass = document.getElementById("loginPassword").value;
    var user = findUserByPhone(phone);
    if (!user || user.password !== pass) {
      showNotice("loginNotice", "err", "No. WhatsApp atau password salah.");
      return;
    }
    customerLogin(user.id);
    this.reset();
    renderAccountChip();
    refreshBookingView();
  });

  document
    .getElementById("registerForm")
    .addEventListener("submit", function (e) {
      e.preventDefault();
      var name = document.getElementById("regName").value.trim();
      var phone = document.getElementById("regPhone").value.trim();
      var pass = document.getElementById("regPassword").value;
      if (!name || !phone || !pass) {
        showNotice(
          "loginNotice",
          "err",
          "Mohon lengkapi semua data pendaftaran.",
        );
        return;
      }
      if (findUserByPhone(phone)) {
        showNotice(
          "loginNotice",
          "err",
          "No. WhatsApp ini sudah terdaftar. Silakan masuk.",
        );
        return;
      }
      var users = getUsers();
      var newUser = {
        id: uid("usr"),
        name: name,
        phone: phone,
        password: pass,
      };
      users.push(newUser);
      saveUsers(users);
      customerLogin(newUser.id);
      this.reset();
      renderAccountChip();
      refreshBookingView();
    });

  function refreshBookingView() {
    var user = getCurrentCustomer();
    var gate = document.getElementById("customerAuthGate");
    var area = document.getElementById("customerBookingArea");
    if (user) {
      gate.style.display = "none";
      area.style.display = "block";
      document.getElementById("custName").value = user.name;
      document.getElementById("custPhone").value = user.phone;
      document.getElementById("bookDate").value = selectedDate;
      populateHourSelect(
        document.getElementById("bookHour"),
        selectedDate,
        selectedHour,
      );
    } else {
      gate.style.display = "block";
      area.style.display = "none";
    }
  }

  document
    .getElementById("backToScheduleBtn")
    .addEventListener("click", function () {
      switchView("schedule");
    });

  document.getElementById("bookDate").addEventListener("change", function () {
    selectedDate = this.value || fmtDate(new Date());
    populateHourSelect(document.getElementById("bookHour"), selectedDate);
  });

  /* File upload -> base64 preview */
  var fileDrop = document.getElementById("fileDrop");
  var proofInput = document.getElementById("proofInput");
  var proofPreview = document.getElementById("proofPreview");
  var proofDataUrl = null;

  fileDrop.addEventListener("click", function () {
    proofInput.click();
  });
  proofInput.addEventListener("change", function (e) {
    var file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showNotice("bookingNotice", "err", "File harus berupa gambar (JPG/PNG).");
      return;
    }
    var reader = new FileReader();
    reader.onload = function (ev) {
      proofDataUrl = ev.target.result;
      proofPreview.src = proofDataUrl;
      proofPreview.style.display = "block";
      document.getElementById("fileDropLabel").textContent =
        "✓ " + file.name + " — klik untuk ganti";
      fileDrop.classList.add("has-file");
    };
    reader.readAsDataURL(file);
  });

  document
    .getElementById("bookingForm")
    .addEventListener("submit", function (e) {
      e.preventDefault();
      var user = getCurrentCustomer();
      if (!user) {
        showNotice(
          "bookingNotice",
          "err",
          "Sesi login berakhir. Silakan masuk kembali.",
        );
        refreshBookingView();
        return;
      }
      var name = document.getElementById("custName").value.trim();
      var phone = document.getElementById("custPhone").value.trim();
      var date = document.getElementById("bookDate").value;
      var hourSel = document.getElementById("bookHour");
      var hour = parseInt(hourSel.value, 10);
      var duration = parseInt(
        document.getElementById("bookDuration").value,
        10,
      );
      var notes = document.getElementById("bookNotes").value.trim();

      if (!name || !phone || !date || isNaN(hour)) {
        showNotice("bookingNotice", "err", "Mohon lengkapi semua data wajib.");
        return;
      }
      if (!proofDataUrl) {
        showNotice(
          "bookingNotice",
          "err",
          "Mohon unggah bukti transfer terlebih dahulu.",
        );
        return;
      }
      if (hour + duration > CLOSE_HOUR) {
        showNotice(
          "bookingNotice",
          "err",
          "Durasi melebihi jam operasional (tutup pukul " +
            CLOSE_HOUR +
            ":00).",
        );
        return;
      }
      var bookings = getBookings();
      if (!rangeIsFree(date, hour, duration, bookings)) {
        showNotice(
          "bookingNotice",
          "err",
          "Maaf, jam yang dipilih baru saja terisi. Silakan pilih jam lain.",
        );
        populateHourSelect(hourSel, date);
        return;
      }

      bookings.push({
        id: uid("bk"),
        name: name,
        phone: phone,
        date: date,
        startHour: hour,
        duration: duration,
        notes: notes,
        proof: proofDataUrl,
        status: "pending",
        createdAt: Date.now(),
        customerId: user.id,
      });
      saveBookings(bookings);

      showNotice(
        "bookingNotice",
        "ok",
        "Pengajuan sewa terkirim! Admin akan memverifikasi bukti bayar Anda dan mengonfirmasi jadwal.",
      );
      document.getElementById("bookDuration").value = "1";
      document.getElementById("bookNotes").value = "";
      proofDataUrl = null;
      proofPreview.style.display = "none";
      document.getElementById("fileDropLabel").textContent =
        "Klik untuk unggah foto / screenshot resi transfer (JPG/PNG)";
      fileDrop.classList.remove("has-file");
      selectedHour = null;
      populateHourSelect(hourSel, date);
      if (isAdminLoggedIn()) renderAdminTable();
    });

  /* ================= ADMIN VIEW ================= */
  function refreshAdminEntry() {
    if (isAdminLoggedIn()) {
      document.getElementById("adminLogin").style.display = "none";
      document.getElementById("adminPanel").style.display = "block";
      renderAdminTable();
    } else {
      document.getElementById("adminLogin").style.display = "block";
      document.getElementById("adminPanel").style.display = "none";
    }
  }

  document
    .getElementById("adminLoginForm")
    .addEventListener("submit", function (e) {
      e.preventDefault();
      var u = document.getElementById("adminUserInput").value.trim();
      var p = document.getElementById("adminPassInput").value.trim();
      if (u === ADMIN_USER && p === ADMIN_PASS) {
        sessionStorage.setItem(ADMIN_SESSION_KEY, "1");
        refreshAdminEntry();
      } else {
        showNotice("adminLoginNotice", "err", "Username atau password salah.");
      }
    });

  document
    .getElementById("adminLogoutBtn")
    .addEventListener("click", function () {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      refreshAdminEntry();
    });

  var currentFilter = "all";
  document
    .getElementById("statusFilters")
    .addEventListener("click", function (e) {
      var btn = e.target.closest("button");
      if (!btn) return;
      currentFilter = btn.getAttribute("data-f");
      this.querySelectorAll("button").forEach(function (b) {
        b.classList.remove("active");
      });
      btn.classList.add("active");
      renderAdminTable();
    });

  function statusBadge(status) {
    var map = {
      pending: "Menunggu",
      approved: "Disetujui",
      rejected: "Ditolak",
    };
    return '<span class="badge ' + status + '">' + map[status] + "</span>";
  }

  function renderAdminTable() {
    var bookings = getBookings()
      .slice()
      .sort(function (a, b) {
        return b.createdAt - a.createdAt;
      });
    var counts = { pending: 0, approved: 0, rejected: 0 };
    bookings.forEach(function (b) {
      counts[b.status] = (counts[b.status] || 0) + 1;
    });
    document.getElementById("statPending").textContent = counts.pending || 0;
    document.getElementById("statApproved").textContent = counts.approved || 0;
    document.getElementById("statRejected").textContent = counts.rejected || 0;

    var filtered =
      currentFilter === "all"
        ? bookings
        : bookings.filter(function (b) {
            return b.status === currentFilter;
          });
    var tbody = document.getElementById("bookingTableBody");
    tbody.innerHTML = "";
    document.getElementById("emptyBookings").style.display = filtered.length
      ? "none"
      : "block";

    filtered.forEach(function (b) {
      var tr = document.createElement("tr");
      var end = b.startHour + parseInt(b.duration, 10);
      var jadwal =
        fmtDateFull(b.date) +
        "<br><span class='mono' style='color:var(--ink-soft);font-size:12px;'>" +
        hourLabel(b.startHour) +
        "–" +
        hourLabel(end) +
        " (" +
        b.duration +
        " jam)</span>";
      var proofCell = b.proof
        ? "<a class='proof-link' href='" +
          b.proof +
          "' target='_blank' rel='noopener'>Lihat Bukti</a>"
        : "<span style='color:var(--ink-soft);'>—</span>";

      var actions = "";
      if (b.status === "pending") {
        actions +=
          "<button class='btn small accent' data-act='approve' data-id='" +
          b.id +
          "'>Setujui</button>";
        actions +=
          "<button class='btn small danger' data-act='reject' data-id='" +
          b.id +
          "'>Tolak</button>";
      }
      if (b.status === "approved") {
        actions +=
          "<button class='btn small danger' data-act='reject' data-id='" +
          b.id +
          "'>Batalkan</button>";
      }
      if (b.status === "rejected") {
        actions +=
          "<button class='btn small accent' data-act='approve' data-id='" +
          b.id +
          "'>Setujui</button>";
      }
      actions +=
        "<button class='btn small ghost' data-act='edit' data-id='" +
        b.id +
        "'>Ubah</button>";
      actions +=
        "<button class='btn small ghost' data-act='delete' data-id='" +
        b.id +
        "'>Hapus</button>";

      tr.innerHTML =
        "<td><b>" +
        escapeHtml(b.name) +
        "</b><br><span class='mono' style='color:var(--ink-soft);font-size:12px;'>" +
        escapeHtml(b.phone) +
        "</span></td>" +
        "<td>" +
        jadwal +
        "</td>" +
        "<td>" +
        proofCell +
        "</td>" +
        "<td>" +
        statusBadge(b.status) +
        "</td>" +
        "<td><div class='row-actions'>" +
        actions +
        "</div></td>";
      tbody.appendChild(tr);
    });
  }

  document
    .getElementById("bookingTableBody")
    .addEventListener("click", function (e) {
      var btn = e.target.closest("button");
      if (!btn) return;
      var id = btn.getAttribute("data-id");
      var act = btn.getAttribute("data-act");
      var bookings = getBookings();
      var idx = bookings.findIndex(function (b) {
        return b.id === id;
      });
      if (idx === -1) return;

      if (act === "approve") {
        bookings[idx].status = "approved";
        saveBookings(bookings);
        renderAdminTable();
        renderSlotGrid();
      } else if (act === "reject") {
        bookings[idx].status = "rejected";
        saveBookings(bookings);
        renderAdminTable();
        renderSlotGrid();
      } else if (act === "delete") {
        if (
          confirm(
            "Hapus pesanan dari " +
              bookings[idx].name +
              "? Tindakan ini tidak bisa dibatalkan.",
          )
        ) {
          bookings.splice(idx, 1);
          saveBookings(bookings);
          renderAdminTable();
          renderSlotGrid();
        }
      } else if (act === "edit") {
        openEditModal(bookings[idx]);
      }
    });

  /* ---------------- Edit modal (admin) ---------------- */
  var editingId = null;
  var modal = document.getElementById("editModal");

  function openEditModal(b) {
    editingId = b.id;
    document.getElementById("editDate").value = b.date;
    populateHourSelect(
      document.getElementById("editHour"),
      b.date,
      b.startHour,
    );
    document.getElementById("editDuration").value = b.duration;
    modal.style.display = "flex";
  }
  document.getElementById("editDate").addEventListener("change", function () {
    populateHourSelect(document.getElementById("editHour"), this.value);
  });
  document
    .getElementById("editCancelBtn")
    .addEventListener("click", function () {
      modal.style.display = "none";
      editingId = null;
    });
  document.getElementById("editSaveBtn").addEventListener("click", function () {
    if (!editingId) return;
    var bookings = getBookings();
    var idx = bookings.findIndex(function (b) {
      return b.id === editingId;
    });
    if (idx === -1) return;
    var newDate = document.getElementById("editDate").value;
    var newHour = parseInt(document.getElementById("editHour").value, 10);
    var newDuration = parseInt(
      document.getElementById("editDuration").value,
      10,
    );

    if (newHour + newDuration > CLOSE_HOUR) {
      alert("Durasi melebihi jam operasional.");
      return;
    }
    if (!rangeIsFree(newDate, newHour, newDuration, bookings, editingId)) {
      alert("Jadwal baru bentrok dengan pesanan lain. Pilih jam lain.");
      return;
    }
    bookings[idx].date = newDate;
    bookings[idx].startHour = newHour;
    bookings[idx].duration = newDuration;
    saveBookings(bookings);
    modal.style.display = "none";
    editingId = null;
    renderAdminTable();
    renderSlotGrid();
  });
  modal.addEventListener("click", function (e) {
    if (e.target === modal) {
      modal.style.display = "none";
      editingId = null;
    }
  });

  /* ---------------- Init ---------------- */
  buildDatePicker();
  renderSlotGrid();
  updateSelectionBar();
  renderAccountChip();
  refreshAdminEntry();
})();
