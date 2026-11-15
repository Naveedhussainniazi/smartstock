import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import {
  Bell,
  UserCircle,
  LogOut,
  Search,
  Menu,
  Package,
  Tags,
  Users,
  Truck,
  ShoppingCart,
  ShoppingBag,
  ClipboardList,
  LoaderCircle,
  X,
  AlertTriangle,
  CheckCheck,
  Check,
} from "lucide-react";

import { logout } from "../../features/auth/authSlice";
import api from "../../services/api";

function Header({ onMenuClick }) {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);

  // GLOBAL SEARCH STATES
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchError, setSearchError] = useState("");

  // NOTIFICATION STATES
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationError, setNotificationError] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);

  const pageTitles = {
    "/": "Dashboard",
    "/products": "Products",
    "/categories": "Categories",
    "/purchases": "Purchases",
    "/sales": "Sales",
    "/customers": "Customers",
    "/suppliers": "Suppliers",
    "/stock": "Stock Management",
    "/stock-movements": "Stock Movements",
    "/stock-adjustments": "Stock Adjustments",
    "/reports": "Reports",
  };

  const pageTitle = pageTitles[location.pathname] || "SmartStock";

  const displayName = user?.name || "Admin";
  const displayRole = user?.role || "User";

  // GLOBAL SEARCH
  useEffect(() => {
    const query = searchQuery.trim();

    if (!query) return;

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        setSearchLoading(true);
        setSearchError("");

        const response = await api.get("/search", {
          params: { query },
          signal: controller.signal,
        });

        setSearchResults(response.data.data || []);
        setShowSearchResults(true);
      } catch (error) {
        if (error.code !== "ERR_CANCELED") {
          console.error("Global search failed:", error);

          setSearchResults([]);
          setSearchError(error.response?.data?.message || "Search failed");
        }
      } finally {
        if (!controller.signal.aborted) {
          setSearchLoading(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery]);

  // FETCH NOTIFICATIONS
  const fetchNotifications = useCallback(async () => {
    try {
      setNotificationLoading(true);
      setNotificationError("");

      const response = await api.get("/notifications");

      setNotifications(response.data.data || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error("Notifications fetch failed:", error);

      setNotificationError(
        error.response?.data?.message || "Unable to load notifications",
      );
    } finally {
      setNotificationLoading(false);
    }
  }, []);

  // INITIAL NOTIFICATION LOAD
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchNotifications();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchNotifications]);

  // SEARCH RESULT ICON
  const getResultIcon = (type) => {
    const icons = {
      product: Package,
      category: Tags,
      customer: Users,
      supplier: Truck,
      sale: ShoppingCart,
      adjustment: ClipboardList,
    };

    return icons[type] || Search;
  };

  // OPEN SEARCH RESULT
  const handleResultClick = (result) => {
    navigate(result.url);

    setSearchQuery("");
    setSearchResults([]);
    setShowSearchResults(false);
  };

  // NOTIFICATION ICON
  const getNotificationIcon = (type) => {
    const icons = {
      low_stock: AlertTriangle,
      out_of_stock: AlertTriangle,
      sale: ShoppingCart,
      purchase: ShoppingBag,
      adjustment: ClipboardList,
    };

    return icons[type] || Bell;
  };

  // NOTIFICATION ICON COLOR
  const getNotificationColor = (type) => {
    const colors = {
      low_stock: "bg-amber-100 text-amber-600",
      out_of_stock: "bg-red-100 text-red-600",
      sale: "bg-green-100 text-green-600",
      purchase: "bg-blue-100 text-blue-600",
      adjustment: "bg-purple-100 text-purple-600",
    };

    return colors[type] || "bg-slate-100 text-slate-600";
  };

  // NOTIFICATION DESTINATION
  const getNotificationUrl = (notification) => {
    switch (notification.referenceModel) {
      case "Product":
        return "/products";

      case "Sale":
        return `/sales/${notification.referenceId}`;

      case "Purchase":
        return "/purchases";

      case "StockAdjustment":
        return "/stock-adjustments";

      default:
        return "/";
    }
  };

  // MARK ONE NOTIFICATION AS READ
  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);

      setNotifications((previous) =>
        previous.map((notification) =>
          notification._id === id
            ? { ...notification, isRead: true }
            : notification,
        ),
      );

      setUnreadCount((previous) => Math.max(0, previous - 1));
    } catch (error) {
      console.error("Mark notification as read failed:", error);
      setNotificationError("Unable to update notification");
    }
  };

  // OPEN NOTIFICATION
  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await handleMarkAsRead(notification._id);
    }

    navigate(getNotificationUrl(notification));
    setShowNotifications(false);
  };

  // MARK ALL AS READ
  const handleMarkAllAsRead = async () => {
    try {
      await api.patch("/notifications/read-all");

      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          isRead: true,
        })),
      );

      setUnreadCount(0);
    } catch (error) {
      console.error("Mark all as read failed:", error);
      setNotificationError("Unable to mark all notifications as read");
    }
  };

  // OPEN NOTIFICATION DROPDOWN
  const handleNotificationToggle = () => {
    const nextState = !showNotifications;

    setShowNotifications(nextState);

    if (nextState) {
      fetchNotifications();
    }
  };

  // LOGOUT
  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error(
        "Logout API request failed:",
        error.response?.data?.message || error.message,
      );
    } finally {
      dispatch(logout());
      navigate("/login", { replace: true });
    }
  };

  // TIME FORMAT
  const formatNotificationDate = (date) => {
    if (!date) return "";

    const notificationDate = new Date(date);

    if (Number.isNaN(notificationDate.getTime())) return "";

    return notificationDate.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-3 shadow-sm sm:px-6 lg:px-8">
      {/* LEFT SECTION */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
        >
          <Menu size={23} />
        </button>

        <div className="min-w-0">
          <h2 className="truncate text-base font-bold text-slate-800 sm:text-lg">
            {pageTitle}
          </h2>

          <p className="hidden text-xs text-slate-500 sm:block">
            Welcome to SmartStock Management System
          </p>
        </div>
      </div>

      {/* RIGHT SECTION */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        {/* GLOBAL SEARCH */}
        <div className="relative hidden md:block">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
            {searchLoading ? (
              <LoaderCircle size={17} className="animate-spin text-blue-500" />
            ) : (
              <Search size={17} className="text-slate-400" />
            )}

            <input
              type="text"
              value={searchQuery}
              placeholder="Search anything..."
              onChange={(e) => {
                const value = e.target.value;

                setSearchQuery(value);
                setShowSearchResults(true);

                if (!value.trim()) {
                  setSearchResults([]);
                  setSearchLoading(false);
                  setSearchError("");
                } else {
                  setSearchResults([]);
                  setSearchError("");
                }
              }}
              onFocus={() => setShowSearchResults(true)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setShowSearchResults(false);
                }

                if (e.key === "Enter" && searchResults.length > 0) {
                  handleResultClick(searchResults[0]);
                }
              }}
              className="w-44 bg-transparent text-sm outline-none placeholder:text-slate-400 lg:w-56"
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setShowSearchResults(false);
                }}
                aria-label="Clear search"
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* SEARCH RESULTS DROPDOWN */}
          {showSearchResults && searchQuery.trim() && (
            <div className="absolute right-0 top-12 z-50 max-h-96 w-80 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl lg:w-96">
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Search Results
                </p>
              </div>

              {searchLoading && searchResults.length === 0 && (
                <div className="flex items-center justify-center gap-2 p-6 text-sm text-slate-500">
                  <LoaderCircle size={17} className="animate-spin" />
                  Searching...
                </div>
              )}

              {!searchLoading && searchError && (
                <p className="p-5 text-center text-sm text-red-500">
                  {searchError}
                </p>
              )}

              {!searchLoading && !searchError && searchResults.length === 0 && (
                <p className="p-6 text-center text-sm text-slate-500">
                  No results found.
                </p>
              )}

              {searchResults.length > 0 && (
                <div className="py-2">
                  {searchResults.map((result) => {
                    const ResultIcon = getResultIcon(result.type);

                    return (
                      <button
                        key={`${result.type}-${result.id}`}
                        type="button"
                        onClick={() => handleResultClick(result)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-blue-50"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                          <ResultIcon size={18} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {result.title}
                          </p>

                          <p className="truncate text-xs capitalize text-slate-500">
                            {result.type} · {result.subtitle}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="border-t border-slate-100 px-4 py-2">
                <p className="text-center text-xs text-slate-400">
                  Search across SmartStock modules
                </p>
              </div>
            </div>
          )}
        </div>

        {/* NOTIFICATION BELL */}
        <div className="relative">
          <button
            type="button"
            onClick={handleNotificationToggle}
            aria-label={`Notifications, ${unreadCount} unread`}
            aria-expanded={showNotifications}
            className="relative rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-blue-600"
          >
            <Bell size={21} />

            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {/* NOTIFICATION DROPDOWN */}
          {showNotifications && (
            <div className="absolute right-0 top-12 z-50 w-[min(360px,calc(100vw-24px))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl sm:w-96">
              {/* HEADER */}
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Notifications
                  </h3>

                  <p className="text-xs text-slate-500">
                    {unreadCount} unread notifications
                  </p>
                </div>

                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllAsRead}
                    className="flex items-center gap-1 text-xs font-semibold text-blue-600 transition hover:text-blue-800"
                  >
                    <CheckCheck size={15} />
                    Mark all read
                  </button>
                )}
              </div>

              {/* NOTIFICATION CONTENT */}
              <div className="max-h-[420px] overflow-y-auto">
                {notificationLoading && notifications.length === 0 && (
                  <div className="flex items-center justify-center gap-2 p-8 text-sm text-slate-500">
                    <LoaderCircle size={18} className="animate-spin" />
                    Loading notifications...
                  </div>
                )}

                {!notificationLoading && notificationError && (
                  <div className="p-6 text-center">
                    <p className="text-sm text-red-500">{notificationError}</p>

                    <button
                      type="button"
                      onClick={fetchNotifications}
                      className="mt-3 text-xs font-semibold text-blue-600 hover:text-blue-800"
                    >
                      Try again
                    </button>
                  </div>
                )}

                {!notificationLoading &&
                  !notificationError &&
                  notifications.length === 0 && (
                    <div className="p-8 text-center">
                      <Bell size={30} className="mx-auto mb-2 text-slate-300" />

                      <p className="text-sm font-medium text-slate-600">
                        No notifications
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        You're all caught up!
                      </p>
                    </div>
                  )}

                {notifications.map((notification) => {
                  const NotificationIcon = getNotificationIcon(
                    notification.type,
                  );

                  return (
                    <div
                      key={notification._id}
                      className={`flex items-start gap-3 border-b border-slate-100 px-4 py-3 transition hover:bg-slate-50 ${
                        !notification.isRead ? "bg-blue-50/50" : ""
                      }`}
                    >
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${getNotificationColor(
                          notification.type,
                        )}`}
                      >
                        <NotificationIcon size={18} />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleNotificationClick(notification)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <p className="text-sm font-semibold text-slate-800">
                          {notification.title}
                        </p>

                        <p className="mt-1 text-xs leading-5 text-slate-600">
                          {notification.message}
                        </p>

                        <p className="mt-1 text-[11px] text-slate-400">
                          {formatNotificationDate(notification.createdAt)}
                        </p>
                      </button>

                      {!notification.isRead && (
                        <button
                          type="button"
                          title="Mark as read"
                          aria-label="Mark notification as read"
                          onClick={() => handleMarkAsRead(notification._id)}
                          className="mt-1 rounded-md p-1 text-blue-500 transition hover:bg-blue-100 hover:text-blue-700"
                        >
                          <Check size={16} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* FOOTER */}
              <div className="border-t border-slate-100 px-4 py-3">
                <button
                  type="button"
                  onClick={() => {
                    navigate("/stock-movements");
                    setShowNotifications(false);
                  }}
                  className="w-full text-center text-xs font-semibold text-blue-600 transition hover:text-blue-800"
                >
                  View Stock Movements
                </button>
              </div>
            </div>
          )}
        </div>

        {/* USER PROFILE */}
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-600 sm:h-10 sm:w-10">
            <UserCircle size={26} />
          </div>

          <div className="hidden sm:block">
            <p className="max-w-28 truncate text-sm font-semibold capitalize text-slate-800">
              {displayName}
            </p>

            <p className="text-xs capitalize text-slate-500">{displayRole}</p>
          </div>
        </div>

        {/* LOGOUT */}
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Logout"
          className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-2 py-2 text-sm font-medium text-red-600 transition hover:border-red-200 hover:bg-red-100 sm:px-3"
        >
          <LogOut size={17} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}

export default Header;
