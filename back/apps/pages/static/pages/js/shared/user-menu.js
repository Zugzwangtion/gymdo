function bindUserMenu(userDropdown, profileLogoutBtn, userBadge) {
    if (userBadge && currentUser?.username) {
        userBadge.textContent = currentUser.username[0].toUpperCase();

        userBadge.addEventListener("click", (event) => {
            event.stopPropagation();
            userDropdown?.classList.toggle("show");
        });
    }

    profileLogoutBtn?.addEventListener("click", async () => {
        const confirmed = confirm("Р’С‹Р№С‚Рё РёР· Р°РєРєР°СѓРЅС‚Р°?");
        if (!confirmed) {
            return;
        }

        try {
            await logoutUser();
            window.location.href = "/login/";
        } catch (error) {
            alert(error.message || "РќРµ СѓРґР°Р»РѕСЃСЊ РІС‹Р№С‚Рё РёР· Р°РєРєР°СѓРЅС‚Р°");
        }
    });

    document.addEventListener("click", (event) => {
        if (!event.target.closest("#userMenuWrap")) {
            userDropdown?.classList.remove("show");
        }
    });
}

