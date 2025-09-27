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
import { ChapterForm } from "@/components/chapters/chapter-form";
import { DeleteChapterDialog } from "@/components/chapters/delete-chapter-dialog";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, MoreHorizontal, Edit, Trash2 } from "lucide-react";

interface Chapter {
	id: string;
	number: number;
	bookId: string;
	bookName?: string;
}

interface Book {
	id: string;
	name: string;
	testament: string;
}

export default function ChaptersPage() {
	const [chapters, setChapters] = useState<Chapter[]>([]);
	const [filteredChapters, setFilteredChapters] = useState<Chapter[]>([]);
	const [books, setBooks] = useState<Book[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [bookFilter, setBookFilter] = useState("all");
	const [showChapterForm, setShowChapterForm] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);

	const { toast } = useToast();

	const fetchData = async () => {
		try {
			setIsLoading(true);
			const [chaptersResponse, booksResponse] = await Promise.all([
				apiClient.getChapters(),
				apiClient.getBooks(),
			]);

			if (booksResponse.success && booksResponse.data) {
				setBooks(booksResponse.data);
			}

			if (chaptersResponse.success && chaptersResponse.data) {
				// Enrich chapters with book names
				const enrichedChapters = chaptersResponse.data.map((chapter: any) => {
					const book = booksResponse.data?.find((b: any) => b.id === chapter.bookId);
					return {
						...chapter,
						bookName: book?.name || "Unknown Book",
					};
				});
				setChapters(enrichedChapters);
				setFilteredChapters(enrichedChapters);
			}
		} catch (error) {
			console.error("Failed to fetch data:", error);
			toast({
				title: "Error",
				description: "Failed to load chapters",
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
		let filtered = chapters;

		if (searchTerm) {
			filtered = filtered.filter(
				(chapter) =>
					chapter.bookName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
					chapter.number.toString().includes(searchTerm)
			);
		}

		if (bookFilter !== "all") {
			filtered = filtered.filter((chapter) => chapter.bookId === bookFilter);
		}

		setFilteredChapters(filtered);
	}, [chapters, searchTerm, bookFilter]);

	const handleCreateChapter = () => {
		setSelectedChapter(null);
		setShowChapterForm(true);
	};

	const handleEditChapter = (chapter: Chapter) => {
		setSelectedChapter(chapter);
		setShowChapterForm(true);
	};

	const handleDeleteChapter = (chapter: Chapter) => {
		setSelectedChapter(chapter);
		setShowDeleteDialog(true);
	};

	const handleFormSuccess = () => {
		fetchData();
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
					<h1 className="text-lg font-semibold md:text-2xl">Chapters Management</h1>
					<p className="text-muted-foreground">
						Manage chapters within Yahuah Dabar books
					</p>
				</div>
				<Button onClick={handleCreateChapter}>
					<Plus className="mr-2 h-4 w-4" />
					Add Chapter
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Chapters</CardTitle>
					<CardDescription>
						A list of all chapters organized by book. You can create, edit, and delete
						chapters.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex items-center gap-4 mb-6">
						<div className="relative flex-1 max-w-sm">
							<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Search chapters or books..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="pl-8"
							/>
						</div>
						<Select
							value={bookFilter}
							onValueChange={setBookFilter}>
							<SelectTrigger className="w-[200px]">
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
					</div>

					{filteredChapters.length === 0 ? (
						<div className="text-center py-8">
							<p className="text-muted-foreground">
								{chapters.length === 0
									? "No chapters found. Create your first chapter!"
									: "No chapters match your search criteria."}
							</p>
						</div>
					) : (
						<div className="rounded-md border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Chapter</TableHead>
										<TableHead>Book</TableHead>
										<TableHead>convenant</TableHead>
										<TableHead className="w-[100px]">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredChapters.map((chapter) => {
										const book = books.find((b) => b.id === chapter.bookId);
										return (
											<TableRow key={chapter.id}>
												<TableCell className="font-medium">
													<Badge variant="outline">Chapter {chapter.number}</Badge>
												</TableCell>
												<TableCell>{chapter.bookName}</TableCell>
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
															<DropdownMenuItem onClick={() => handleEditChapter(chapter)}>
																<Edit className="mr-2 h-4 w-4" />
																Edit
															</DropdownMenuItem>
															<DropdownMenuItem
																onClick={() => handleDeleteChapter(chapter)}
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

			<ChapterForm
				chapter={selectedChapter}
				open={showChapterForm}
				onOpenChange={setShowChapterForm}
				onSuccess={handleFormSuccess}
			/>

			<DeleteChapterDialog
				chapter={selectedChapter}
				open={showDeleteDialog}
				onOpenChange={setShowDeleteDialog}
				onSuccess={handleFormSuccess}
			/>
		</DashboardLayout>
	);
}
