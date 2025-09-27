"use client";

import { useEffect, useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, FileText, Quote, Clock } from "lucide-react";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/dashboard-layout";

interface DashboardStats {
	books: number;
	chapters: number;
	verses: number;
	lastUpdated: string | null;
}

export default function DashboardPage() {
	const [stats, setStats] = useState<DashboardStats>({
		books: 0,
		chapters: 0,
		verses: 0,
		lastUpdated: null,
	});
	const [isLoading, setIsLoading] = useState(true);
	const { toast } = useToast();

	useEffect(() => {
		const fetchStats = async () => {
			try {
				const [
					booksResponse,
					chaptersResponse,
					versesResponse,
					lastUpdatedResponse,
				] = await Promise.all([
					apiClient.getBooks(),
					apiClient.getChapters(),
					apiClient.getVerses(),
					apiClient.getLastUpdated(),
				]);

				setStats({
					books: booksResponse.data?.length || 0,
					chapters: chaptersResponse.data?.length || 0,
					verses: versesResponse.data?.length || 0,
					lastUpdated: lastUpdatedResponse.data?.lastUpdated || null,
				});
			} catch (error) {
				console.error("Failed to fetch dashboard stats:", error);
				toast({
					title: "Error",
					description: "Failed to load dashboard statistics",
					variant: "destructive",
				});
			} finally {
				setIsLoading(false);
			}
		};

		fetchStats();
	}, [toast]);

	const formatDate = (dateString: string | null) => {
		if (!dateString) return "Never";
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	if (isLoading) {
		return (
			<DashboardLayout>
				<div className="flex items-center justify-center h-64">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
				</div>
			</DashboardLayout>
		);
	}

	return (
		<DashboardLayout>
			<div className="flex items-center">
				<h1 className="text-lg font-semibold md:text-2xl">Dashboard Overview</h1>
			</div>

			<div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Books</CardTitle>
						<BookOpen className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{stats.books}</div>
						<p className="text-xs text-muted-foreground">Books in the database</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Chapters</CardTitle>
						<FileText className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{stats.chapters}</div>
						<p className="text-xs text-muted-foreground">Chapters across all books</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Verses</CardTitle>
						<Quote className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{stats.verses}</div>
						<p className="text-xs text-muted-foreground">
							Verses across all chapters
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Last Updated</CardTitle>
						<Clock className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-sm font-medium">{formatDate(stats.lastUpdated)}</div>
						<p className="text-xs text-muted-foreground">Most recent modification</p>
					</CardContent>
				</Card>
			</div>

			<div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
				<Card className="xl:col-span-2">
					<CardHeader>
						<CardTitle>Welcome to Yahuah Dabar Admin Dashboard</CardTitle>
						<CardDescription>
							Manage your Yahuah Dabar content with ease
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<p className="text-sm text-muted-foreground">
							Use this dashboard to manage books, chapters, and verses in your Yahuah
							Dabar database. You can create, edit, and delete content as needed.
						</p>
						<div className="flex flex-wrap gap-2">
							<Badge variant="secondary">Books Management</Badge>
							<Badge variant="secondary">Chapters Management</Badge>
							<Badge variant="secondary">Verses Management</Badge>
							<Badge variant="secondary">Export Functionality</Badge>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Quick Actions</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2">
						<p className="text-sm text-muted-foreground">
							Navigate to different sections:
						</p>
						<ul className="text-sm space-y-1">
							<li>• Manage Books and convenants</li>
							<li>• Organize Chapters by Book</li>
							<li>• Edit Individual Verses</li>
							<li>• Export Complete Yahuah Dabar Data</li>
						</ul>
					</CardContent>
				</Card>
			</div>
		</DashboardLayout>
	);
}
