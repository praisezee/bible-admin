"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DashboardLayout } from "@/components/dashboard-layout";
import { VerseForm } from "@/components/verses/verse-form";
import { DeleteVerseDialog } from "@/components/verses/delete-verse-dialog";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, MoreHorizontal, Edit, Trash2 } from "lucide-react";

interface Verse {
	id: string;
	number: number;
	text: string;
	chapterId: string;
	chapterNumber?: number;
	bookName?: string;
}

interface Book {
	id: string;
	name: string;
	testament: string;
}

interface Chapter {
	id: string;
	number: number;
	bookId: string;
}

export default function VersesPage() {
	const [verses, setVerses] = useState<Verse[]>([]);
	const [filteredVerses, setFilteredVerses] = useState<Verse[]>([]);
	const [books, setBooks] = useState<Book[]>([]);
	const [chapters, setChapters] = useState<Chapter[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [bookFilter, setBookFilter] = useState("all");
	const [chapterFilter, setChapterFilter] = useState("all");
	const [showVerseForm, setShowVerseForm] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [selectedVerse, setSelectedVerse] = useState<Verse | null>(null);

	const { toast } = useToast();

	const fetchData = async () => {
		try {
			setIsLoading(true);
			const [versesResponse, booksResponse, chaptersResponse] = await Promise.all([
				apiClient.getVerses(),
				apiClient.getBooks(),
				apiClient.getChapters(),
			]);

			if (booksResponse.success && booksResponse.data) {
				setBooks(booksResponse.data);
			}

			if (chaptersResponse.success && chaptersResponse.data) {
				setChapters(chaptersResponse.data);
			}

			if (versesResponse.success && versesResponse.data) {
				// Enrich verses with book and chapter information
				const enrichedVerses = versesResponse.data.map((verse: any) => {
					const chapter = chaptersResponse.data?.find(
						(c: any) => c.id === verse.chapterId
					);
					const book = booksResponse.data?.find(
						(b: any) => b.id === chapter?.bookId
					);
					return {
						...verse,
						chapterNumber: chapter?.number || 0,
						bookName: book?.name || "Unknown Book",
					};
				});
				setVerses(enrichedVerses);
				setFilteredVerses(enrichedVerses);
			}
		} catch (error) {
			console.error("Failed to fetch data:", error);
			toast({
				title: "Error",
				description: "Failed to load verses",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, []);

	useEffect(() => {
		let filtered = verses;

		if (searchTerm) {
			filtered = filtered.filter(
				(verse) =>
					verse.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
					verse.bookName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
					verse.number.toString().includes(searchTerm)
			);
		}

		if (bookFilter !== "all") {
			const selectedBookChapters = chapters.filter((c) => c.bookId === bookFilter);
			filtered = filtered.filter((verse) =>
				selectedBookChapters.some((chapter) => chapter.id === verse.chapterId)
			);
		}

		if (chapterFilter !== "all") {
			filtered = filtered.filter((verse) => verse.chapterId === chapterFilter);
		}

		setFilteredVerses(filtered);
	}, [verses, searchTerm, bookFilter, chapterFilter, chapters]);

	const handleCreateVerse = () => {
		setSelectedVerse(null);
		setShowVerseForm(true);
	};

	const handleEditVerse = (verse: Verse) => {
		setSelectedVerse(verse);
		setShowVerseForm(true);
	};

	const handleDeleteVerse = (verse: Verse) => {
		setSelectedVerse(verse);
		setShowDeleteDialog(true);
	};

	const handleFormSuccess = () => {
		fetchData();
	};

	const truncateText = (text: string, maxLength = 100) => {
		if (text.length <= maxLength) return text;
		return text.substring(0, maxLength) + "...";
	};

	const getAvailableChapters = () => {
		if (bookFilter === "all") return chapters;
		return chapters.filter((chapter) => chapter.bookId === bookFilter);
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
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-lg font-semibold md:text-2xl">Verses Management</h1>
					<p className="text-muted-foreground">
						Manage individual verses within chapters
					</p>
				</div>
				<Button onClick={handleCreateVerse}>
					<Plus className="mr-2 h-4 w-4" />
					Add Verse
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Verses</CardTitle>
					<CardDescription>
						A list of all verses organized by book and chapter. You can create, edit,
						and delete verses.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex items-center gap-4 mb-6 flex-wrap">
						<div className="relative flex-1 min-w-[200px]">
							<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Search verses, books, or numbers..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="pl-8"
							/>
						</div>
						<Select
							value={bookFilter}
							onValueChange={setBookFilter}>
							<SelectTrigger className="w-[180px]">
								<SelectValue placeholder="Filter by book" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Books</SelectItem>
								{books.map((book) => (
									<SelectItem
										key={book.id}
										value={book.id}>
										{book.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Select
							value={chapterFilter}
							onValueChange={setChapterFilter}>
							<SelectTrigger className="w-[180px]">
								<SelectValue placeholder="Filter by chapter" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Chapters</SelectItem>
								{getAvailableChapters().map((chapter) => {
									const book = books.find((b) => b.id === chapter.bookId);
									return (
										<SelectItem
											key={chapter.id}
											value={chapter.id}>
											{book?.name} Ch. {chapter.number}
										</SelectItem>
									);
								})}
							</SelectContent>
						</Select>
					</div>

					{filteredVerses.length === 0 ? (
						<div className="text-center py-8">
							<p className="text-muted-foreground">
								{verses.length === 0
									? "No verses found. Create your first verse!"
									: "No verses match your search criteria."}
							</p>
						</div>
					) : (
						<div className="rounded-md border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Reference</TableHead>
										<TableHead>Text</TableHead>
										<TableHead>convenant</TableHead>
										<TableHead className="w-[100px]">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredVerses.map((verse) => {
										const chapter = chapters.find((c) => c.id === verse.chapterId);
										const book = books.find((b) => b.id === chapter?.bookId);
										return (
											<TableRow key={verse.id}>
												<TableCell className="font-medium">
													<div className="space-y-1">
														<div className="font-semibold">{verse.bookName}</div>
														<Badge variant="outline">
															{verse.chapterNumber}:{verse.number}
														</Badge>
													</div>
												</TableCell>
												<TableCell className="max-w-md">
													<p className="text-sm leading-relaxed">
														{truncateText(verse.text, 150)}
													</p>
												</TableCell>
												<TableCell>
													{book && (
														<Badge
															variant={
																book.testament === "OLD"
																	? "default"
																	: book.testament === "NEW"
																	? "secondary"
																	: "outline"
															}>
															{book.testament === "OLD"
																? "Old convenant"
																: book.testament === "NEW"
																? "New convenant"
																: "Custom"}
														</Badge>
													)}
												</TableCell>
												<TableCell>
													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<Button
																variant="ghost"
																className="h-8 w-8 p-0">
																<span className="sr-only">Open menu</span>
																<MoreHorizontal className="h-4 w-4" />
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent align="end">
															<DropdownMenuItem onClick={() => handleEditVerse(verse)}>
																<Edit className="mr-2 h-4 w-4" />
																Edit
															</DropdownMenuItem>
															<DropdownMenuItem
																onClick={() => handleDeleteVerse(verse)}
																className="text-destructive">
																<Trash2 className="mr-2 h-4 w-4" />
																Delete
															</DropdownMenuItem>
														</DropdownMenuContent>
													</DropdownMenu>
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>

			<VerseForm
				verse={selectedVerse}
				open={showVerseForm}
				onOpenChange={setShowVerseForm}
				onSuccess={handleFormSuccess}
			/>

			<DeleteVerseDialog
				verse={selectedVerse}
				open={showDeleteDialog}
				onOpenChange={setShowDeleteDialog}
				onSuccess={handleFormSuccess}
			/>
		</DashboardLayout>
	);
}
