"use strict";

/* Phân quyền người dùng (Role-Based Access Control) */
const Auth = {
  isAdmin() {
    return sessionStorage.getItem("hnag.role") === "admin";
  },

  getPin() {
    return localStorage.getItem("hnag.admin_pin") || "1234";
  },

  setPin(newPin) {
    if (!newPin || newPin.length < 4) {
      throw new Error("Mã PIN phải có ít nhất 4 ký tự!");
    }
    localStorage.setItem("hnag.admin_pin", newPin);
  },

  login(pin) {
    if (pin === this.getPin()) {
      sessionStorage.setItem("hnag.role", "admin");
      this.updateUI();
      return true;
    }
    return false;
  },

  logout() {
    sessionStorage.removeItem("hnag.role");
    this.updateUI();
  },

  updateUI() {
    const admin = this.isAdmin();
    const roleBtn = $("roleBtn");
    const addBtn = $("add");
    const noteEl = $("note");

    if (roleBtn) {
      if (admin) {
        roleBtn.className = "hdr-btn role-btn is-admin";
        roleBtn.innerHTML = `<span>👑</span> <span class="role-text">Quản trị</span>`;
        roleBtn.title = "Bấm để quản lý tài khoản hoặc đổi mã PIN";
      } else {
        roleBtn.className = "hdr-btn role-btn is-guest";
        roleBtn.innerHTML = `<span>🔒</span> <span class="role-text">Khách</span>`;
        roleBtn.title = "Bấm để đăng nhập quyền Quản trị";
      }
    }

    if (addBtn) {
      addBtn.style.display = admin ? "inline-flex" : "none";
    }

    if (noteEl) {
      if (admin) {
        noteEl.innerHTML = `👑 <b>Chế độ Quản trị:</b> Bạn có quyền thêm món, chỉnh sửa giá, đổi ảnh đại diện và xóa món.`;
      } else {
        noteEl.innerHTML = `🔒 <b>Chế độ Khách:</b> Chọn mức ngân sách và bấm <b>MỞ HÒM</b> để quay món ăn. Chỉ Quản trị viên mới có quyền sửa món.`;
      }
    }

    // Cập nhật lại trạng thái hiển thị của lưới vật phẩm
    if (typeof renderGrid === "function") {
      renderGrid();
    }
  }
};
