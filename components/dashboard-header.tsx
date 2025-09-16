"use client";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ModeToggle } from "@/components/mode-toggle";
import { MobileSidebar } from "@/components/dashboard-sidebar";
import { useAuthStore } from "@/lib/auth-store";
import { LogOut, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export function DashboardHeader() {
	const { logout, refreshToken } = useAuthStore();
	const { toast } = useToast();
	const [isRefreshing, setIsRefreshing] = useState(false);

	const handleLogout = () => {
		logout();
		toast({
			title: "Logged out",
			description: "You have been logged out successfully",
		});
	};

	const handleRefreshToken = async () => {
		setIsRefreshing(true);
		try {
			await refreshToken();
			toast({
				title: "Token refreshed",
				description: "Your session has been refreshed",
			});
		} catch (error) {
			toast({
				title: "Refresh failed",
				description: "Failed to refresh token. Please log in again.",
				variant: "destructive",
			});
		} finally {
			setIsRefreshing(false);
		}
	};

	return (
		<header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
			<MobileSidebar />

			<div className="flex-1">
				<h1 className="text-lg font-semibold md:text-2xl">
					Yahuah Dabar Admin Dashboard
				</h1>
			</div>

			<div className="flex items-center gap-4">
				<ModeToggle />

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="secondary"
							size="icon"
							className="rounded-full">
							<Avatar className="h-8 w-8">
								<AvatarFallback>AD</AvatarFallback>
							</Avatar>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuLabel>Admin Account</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onClick={handleRefreshToken}
							disabled={isRefreshing}>
							<RefreshCw
								className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
							/>
							Refresh Token
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem onClick={handleLogout}>
							<LogOut className="mr-2 h-4 w-4" />
							Logout
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</header>
	);
}
